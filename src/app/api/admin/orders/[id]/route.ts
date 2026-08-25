import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Admin-only: record that a Pay-on-Delivery order was paid in person.
// Sets payment_status=paid, paid_at, and WHO recorded it — never trust the
// customer-facing client with this operation.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()
    if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => null)
    if (!body || body.action !== 'mark_paid') {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
    }

    const { id } = await params
    // Idempotent guard: only flip pending → paid.
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        payment_recorded_by: user.id,
      })
      .eq('id', id)
      .eq('payment_status', 'pending')
      .select('id, order_number, payment_status, paid_at')
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found or payment already recorded.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ order })
  } catch (err) {
    console.error('[admin order PATCH]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
