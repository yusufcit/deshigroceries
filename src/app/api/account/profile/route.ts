import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cleanString, isValidPhone } from '@/lib/account-validation'

/**
 * PATCH /api/account/profile — updates the signed-in customer's own details.
 * RLS ("Users can update own data") scopes the update to their own row.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const fullName = cleanString(body.full_name, 200)
  const phone = cleanString(body.phone, 20)

  if (!fullName) return NextResponse.json({ error: 'Your name is required.' }, { status: 400 })
  if (!phone) return NextResponse.json({ error: 'A phone number is required for delivery updates.' }, { status: 400 })
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: 'Please enter a valid phone number (e.g. +353 87 123 4567).' }, { status: 400 })
  }

  const { error } = await supabase
    .from('customers')
    .update({ full_name: fullName, phone, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    console.error('profile update error:', error.message)
    return NextResponse.json({ error: 'Could not save your details. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ full_name: fullName, phone })
}