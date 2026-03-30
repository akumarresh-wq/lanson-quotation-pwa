import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: { user: caller } } = await callerClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check caller is admin
    const { data: callerProfile } = await callerClient
      .from('3_disc_profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, pin, full_name, phone, role, branch_id, lm_number } = await req.json()

    // Validate
    if (!email || !pin || !full_name || !phone) {
      return new Response(JSON.stringify({ error: 'email, pin, full_name, and phone are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!/^\d{6}$/.test(pin)) {
      return new Response(JSON.stringify({ error: 'PIN must be exactly 6 digits' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create auth user
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
      user_metadata: { full_name, phone },
      app_metadata: { app: 'lanson-quotation', role, lm_number },
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update profile with role, branch, lm_number
    const updates: Record<string, unknown> = {}
    if (role) updates.role = role
    if (branch_id) updates.branch_id = branch_id
    if (lm_number) updates.lm_number = lm_number

    if (Object.keys(updates).length > 0) {
      await adminClient
        .from('3_disc_profiles')
        .update(updates)
        .eq('id', newUser.user.id)
    }

    return new Response(
      JSON.stringify({ id: newUser.user.id, email: newUser.user.email }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
