import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://esm.sh/xlsx@0.20.0'
import { corsHeaders } from '../_shared/cors.ts'

// Expected column headers in the uploaded file
const EXPECTED_COLUMNS = [
  'Model',
  'Variant',
  'Fuel',
  'Transmission',
  'Ex-Showroom',
  'GST',
  'TCS',
  'Insurance',
  'RTO',
  'FASTag',
  'Accessories',
] as const

interface PriceRow {
  model: string
  variant: string
  fuel: string
  transmission: string
  ex_showroom: number
  gst: number
  tcs: number
  insurance: number
  rto: number
  fastag: number
  accessories: number
}

function parseNumericValue(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

function parseRow(row: Record<string, unknown>): PriceRow | null {
  const model = String(row['Model'] || '').trim()
  const variant = String(row['Variant'] || '').trim()

  // Skip rows without model or variant
  if (!model || !variant) return null

  return {
    model,
    variant,
    fuel: String(row['Fuel'] || '').trim(),
    transmission: String(row['Transmission'] || '').trim(),
    ex_showroom: parseNumericValue(row['Ex-Showroom']),
    gst: parseNumericValue(row['GST']),
    tcs: parseNumericValue(row['TCS']),
    insurance: parseNumericValue(row['Insurance']),
    rto: parseNumericValue(row['RTO']),
    fastag: parseNumericValue(row['FASTag']),
    accessories: parseNumericValue(row['Accessories']),
  }
}

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

    // Get auth user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Verify admin role
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: profile, error: profileError } = await serviceClient
      .from('1_dm_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Could not verify user profile' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can upload price lists' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null
    const effectiveFrom = formData.get('effective_from') as string | null

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'file is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!effectiveFrom) {
      return new Response(
        JSON.stringify({ error: 'effective_from is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Read and parse the file
    const arrayBuffer = await file.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)
    const workbook = XLSX.read(data, { type: 'array' })

    // Use the first sheet
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      return new Response(
        JSON.stringify({ error: 'The uploaded file contains no sheets' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sheet = workbook.Sheets[firstSheetName]
    const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)

    if (jsonRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'The uploaded file contains no data rows' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate that expected columns exist
    const fileColumns = Object.keys(jsonRows[0])
    const missingColumns = EXPECTED_COLUMNS.filter(col => !fileColumns.includes(col))
    if (missingColumns.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Missing required columns: ${missingColumns.join(', ')}`,
          found_columns: fileColumns,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse all rows
    const parsedRows: PriceRow[] = []
    const parseErrors: string[] = []

    for (let i = 0; i < jsonRows.length; i++) {
      const parsed = parseRow(jsonRows[i])
      if (parsed) {
        parsedRows.push(parsed)
      } else {
        parseErrors.push(`Row ${i + 2}: missing Model or Variant, skipped`)
      }
    }

    if (parsedRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid rows found in the file', parse_errors: parseErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all existing models
    const { data: existingModels, error: modelsError } = await serviceClient
      .from('1_dm_vehicle_models')
      .select('id, name')

    if (modelsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch vehicle models: ' + modelsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build a lookup map: lowercase model name -> model record
    const modelMap = new Map<string, { id: string; name: string }>()
    for (const model of existingModels || []) {
      modelMap.set(model.name.toLowerCase(), model)
    }

    // Fetch all existing variants
    const { data: existingVariants, error: variantsError } = await serviceClient
      .from('1_dm_vehicle_variants')
      .select('id, model_id, name, fuel_type, transmission')

    if (variantsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch vehicle variants: ' + variantsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build a lookup map: "model_id|variant_name_lower" -> variant record
    const variantMap = new Map<string, { id: string; model_id: string; name: string }>()
    for (const variant of existingVariants || []) {
      const key = `${variant.model_id}|${variant.name.toLowerCase()}`
      variantMap.set(key, variant)
    }

    // Process rows: resolve model and variant IDs
    const variantIds: string[] = []
    const errors: string[] = [...parseErrors]

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i]

      // Look up the model
      const model = modelMap.get(row.model.toLowerCase())
      if (!model) {
        errors.push(`Row ${i + 2}: model "${row.model}" not found, skipped`)
        variantIds.push('')
        continue
      }

      // Look up or create the variant
      const variantKey = `${model.id}|${row.variant.toLowerCase()}`
      let variant = variantMap.get(variantKey)

      if (!variant) {
        // Create the variant
        const { data: newVariant, error: createError } = await serviceClient
          .from('1_dm_vehicle_variants')
          .insert({
            model_id: model.id,
            name: row.variant,
            fuel_type: row.fuel || null,
            transmission: row.transmission || null,
          })
          .select('id, model_id, name')
          .single()

        if (createError) {
          errors.push(`Row ${i + 2}: failed to create variant "${row.variant}": ${createError.message}`)
          variantIds.push('')
          continue
        }

        variant = newVariant
        variantMap.set(variantKey, newVariant)
      }

      variantIds.push(variant.id)
    }

    // Filter to only rows with valid variant IDs
    const validItems = parsedRows
      .map((row, i) => ({ row, variantId: variantIds[i] }))
      .filter(({ variantId }) => variantId !== '')

    if (validItems.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No valid items could be processed',
          errors,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deactivate all previous price lists
    const { error: deactivateError } = await serviceClient
      .from('1_dm_price_lists')
      .update({ is_active: false })
      .eq('is_active', true)

    if (deactivateError) {
      console.error('Error deactivating previous price lists:', deactivateError)
      return new Response(
        JSON.stringify({ error: 'Failed to deactivate previous price lists: ' + deactivateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the new price list
    const { data: priceList, error: priceListError } = await serviceClient
      .from('1_dm_price_lists')
      .insert({
        title,
        effective_from: effectiveFrom,
        is_active: true,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (priceListError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create price list: ' + priceListError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Bulk insert price list items
    const priceListItems = validItems.map(({ row, variantId }) => ({
      price_list_id: priceList.id,
      variant_id: variantId,
      ex_showroom: row.ex_showroom,
      gst: row.gst,
      tcs: row.tcs,
      insurance: row.insurance,
      rto: row.rto,
      fastag: row.fastag,
      accessories: row.accessories,
    }))

    const { error: itemsError } = await serviceClient
      .from('1_dm_price_list_items')
      .insert(priceListItems)

    if (itemsError) {
      // Clean up: delete the price list if items failed to insert
      await serviceClient.from('1_dm_price_lists').delete().eq('id', priceList.id)
      return new Response(
        JSON.stringify({ error: 'Failed to insert price list items: ' + itemsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        price_list_id: priceList.id,
        items_count: validItems.length,
        skipped_rows: parsedRows.length - validItems.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error in upload-price-list:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
