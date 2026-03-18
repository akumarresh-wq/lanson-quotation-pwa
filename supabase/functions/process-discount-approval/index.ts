import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { request_id, action, remarks, approved_amount } = await req.json()

    // Validate required fields
    if (!request_id) {
      return new Response(
        JSON.stringify({ error: 'request_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!action || !['approved', 'rejected'].includes(action)) {
      return new Response(
        JSON.stringify({ error: "action must be 'approved' or 'rejected'" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the auth user from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client with the user's JWT to get their identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use the service role client to call the DB function
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: result, error: rpcError } = await serviceClient.rpc('process_approval', {
      p_request_id: request_id,
      p_action: action,
      p_actor_id: user.id,
      p_remarks: remarks || null,
      p_amount: approved_amount || null,
    })

    if (rpcError) {
      console.error('process_approval RPC error:', rpcError)
      return new Response(
        JSON.stringify({ error: rpcError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the updated request with requestor details
    const { data: updatedRequest, error: fetchError } = await serviceClient
      .from('1_dm_discount_requests')
      .select('*, requestor:profiles!requested_by(id, full_name, push_subscription)')
      .eq('id', request_id)
      .single()

    if (fetchError) {
      console.error('Error fetching updated request:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Approval processed but failed to fetch updated request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a notification for the requestor (the sales officer)
    const notificationMessage = action === 'approved'
      ? `Your discount request has been approved${approved_amount ? ` for ${approved_amount}` : ''}.`
      : `Your discount request has been rejected.${remarks ? ` Reason: ${remarks}` : ''}`

    const { error: notifError } = await serviceClient
      .from('1_dm_notifications')
      .insert({
        user_id: updatedRequest.requested_by,
        title: `Discount Request ${action === 'approved' ? 'Approved' : 'Rejected'}`,
        body: notificationMessage,
        type: 'discount_approval',
        reference_id: request_id,
        reference_type: 'discount_request',
      })

    if (notifError) {
      console.error('Error creating notification:', notifError)
      // Don't fail the request, notification is non-critical
    }

    // Optionally send a push notification if the requestor has a push_subscription
    if (updatedRequest.requestor?.push_subscription) {
      try {
        const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          },
          body: JSON.stringify({
            subscription: updatedRequest.requestor.push_subscription,
            title: `Discount Request ${action === 'approved' ? 'Approved' : 'Rejected'}`,
            body: notificationMessage,
            data: {
              type: 'discount_approval',
              request_id: request_id,
            },
          }),
        })

        if (!pushResponse.ok) {
          console.error('Push notification failed:', await pushResponse.text())
        }
      } catch (pushError) {
        console.error('Error sending push notification:', pushError)
        // Don't fail the request, push is non-critical
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        request: updatedRequest,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
