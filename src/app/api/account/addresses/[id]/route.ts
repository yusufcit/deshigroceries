import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cleanString, isValidPhone, parseBoolean } from '@/lib/account-validation'

/**
 * PATCH /api/account/addresses/[id]
 * Updates one of the signed-in customer's own addresses (partial updates OK).
 * Both the id and customer_id are scoped in the query, so one customer can
 * never touch another customer's address (RLS enforces this as well).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const update: Record<string, string | boolean | null> = { updated_at: new Date().toISOString() }

  if ('full_name' in body) {
    const v = cleanString(body.full_name, 200)
    if (!v) return NextResponse.json({ error: 'Recipient name is required.' }, { status: 400 })
    update.full_name = v
  }
  if ('phone' in body) {
    const v = cleanString(body.phone, 20)
    if (!isValidPhone(v)) {
      return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 })
    }
    update.phone = v
  }
  if ('address_line1' in body) {
    const v = cleanString(body.address_line1, 255)
    if (!v) return NextResponse.json({ error: 'Address line 1 is required.' }, { status: 400 })
    update.address_line1 = v
  }
  if ('address_line2' in body) update.address_line2 = cleanString(body.address_line2, 255) || null
  if ('city' in body) update.city = cleanString(body.city, 100) || 'Dublin'
  if ('county' in body) update.county = cleanString(body.county, 100) || 'Dublin'
  if ('eircode' in body) update.eircode = cleanString(body.eircode, 10) || null
  if ('delivery_instructions' in body) update.delivery_instructions = cleanString(body.delivery_instructions, 500) || null
  if ('is_default' in body) update.is_default = parseBoolean(body.is_default)

  // Promote to default → demote every other address first.
  if (update.is_default === true) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('customer_id', user.id)
      .eq('is_default', true)
      .neq('id', id)
  }

  const { data: address, error } = await supabase
    .from('addresses')
    .update(update)
    .eq('customer_id', user.id)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !address) {
    console.error('address update error:', error?.message)
    return NextResponse.json({ error: 'Could not update the address.' }, { status: 404 })
  }

  return NextResponse.json({ address })
}

/**
 * DELETE /api/account/addresses/[id]
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }

  const { data: deleted, error } = await supabase
    .from('addresses')
    .delete()
    .eq('customer_id', user.id)
    .eq('id', id)
    .select('id')
    .single()

  if (error || !deleted) {
    return NextResponse.json({ error: 'Could not delete the address.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}