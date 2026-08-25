import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/orders/[orderId]
 * Returns a single order (with line items) for the checkout confirmation page.
 *
 * Security:
 * - Uses the service-role (admin) client so RLS does not block guest orders
 *   (customer_id IS NULL). The order ID is an unguessable UUID that only the
 *   placing browser knows, which is the same security model as "track your
 *   order" links used by couriers.
 * - For logged-in users the handler verifies that the order belongs to them.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const { data: order, error } = await admin
    .from('orders')
    .select(`
      id, order_number, customer_id, total, subtotal, delivery_fee,
      payment_method, payment_status, status,
      delivery_date, delivery_slot,
      customer_name, customer_email, customer_phone,
      delivery_address_line1, delivery_address_line2, delivery_city, delivery_county,
      delivery_eircode, delivery_instructions, created_at
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  // Logged-in users may only view their own orders.
  if (user && order.customer_id && order.customer_id !== user.id) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  const { data: items } = await admin
    .from('order_items')
    .select('product_name, product_image_url, weight_option, quantity, unit_price, total_price')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ order: { ...order, items: items ?? [] } })
}
