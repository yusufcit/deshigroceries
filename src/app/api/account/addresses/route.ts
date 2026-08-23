import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cleanString, isValidPhone, parseBoolean } from '@/lib/account-validation'

/**
 * POST /api/account/addresses
 * Adds a delivery address for the signed-in customer.
 * RLS ("Users can insert own addresses") scopes the insert to their own id.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const fullName = cleanString(body.full_name, 200)
  const phone = cleanString(body.phone, 20)
  const line1 = cleanString(body.address_line1, 255)

  if (!fullName) return NextResponse.json({ error: 'Recipient name is required.' }, { status: 400 })
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 })
  }
  if (!line1) return NextResponse.json({ error: 'Address line 1 is required.' }, { status: 400 })

  const payload = {
    customer_id: user.id,
    full_name: fullName,
    phone,
    address_line1: line1,
    address_line2: cleanString(body.address_line2, 255) || null,
    city: cleanString(body.city, 100) || 'Dublin',
    county: cleanString(body.county, 100) || 'Dublin',
    eircode: cleanString(body.eircode, 10) || null,
    delivery_instructions: cleanString(body.delivery_instructions, 500) || null,
    is_default: parseBoolean(body.is_default),
  }

  // New default → clear any previous default first.
  if (payload.is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('customer_id', user.id)
  }

  const { data: address, error } = await supabase
    .from('addresses')
    .insert(payload)
    .select('*')
    .single()

  if (error || !address) {
    console.error('address insert error:', error?.message)
    return NextResponse.json({ error: 'Could not save the address. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ address }, { status: 201 })
}