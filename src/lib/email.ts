import { createAdminClient } from './supabase/admin'

/** Format price in euros (server-safe, no Intl collision) */
function fmt(amount: number): string {
  return `€${amount.toFixed(2)}`
}

/** Format date like "Sat, 29 Aug" */
function fmtDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  return d.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

interface OrderForEmail {
  order_number: string
  customer_name: string
  customer_email: string
  payment_method: 'card' | 'pay_on_delivery'
  payment_status: string
  total: number
  subtotal: number
  delivery_fee: number
  delivery_date: string
  delivery_slot: string
  delivery_address_line1: string
  delivery_address_line2?: string | null
  delivery_city: string
  delivery_county?: string | null
  delivery_eircode?: string | null
  items: Array<{
    product_name: string
    weight_option?: string | null
    quantity: number
    total_price: number
  }>
}

/** Build a plain-text order-confirmation message. */
function buildText(order: OrderForEmail): string {
  const lines: string[] = []
  lines.push(`Hi ${order.customer_name},`)
  lines.push('')
  lines.push(`Your order #${order.order_number} has been received!`)
  lines.push('')
  lines.push('── Order Summary ──')
  for (const it of order.items) {
    const name = it.weight_option ? `${it.product_name} (${it.weight_option})` : it.product_name
    lines.push(`  ${name} × ${it.quantity}  ${fmt(it.total_price)}`)
  }
  lines.push('')
  lines.push(`  Subtotal          ${fmt(order.subtotal)}`)
  lines.push(`  Delivery           ${order.delivery_fee === 0 ? 'FREE' : fmt(order.delivery_fee)}`)
  lines.push(`  Total              ${fmt(order.total)}`)
  lines.push('')
  lines.push(`Payment:      ${order.payment_method === 'pay_on_delivery' ? 'Pay on Delivery' : 'Card'}`)
  lines.push(`Status:       ${order.payment_status === 'paid' ? 'Paid' : 'Pending'}`)
  lines.push('')
  lines.push(`Delivery:     ${fmtDate(order.delivery_date)} — ${order.delivery_slot.replace('-', '–')}`)
  const addrParts = [order.delivery_address_line1]
  if (order.delivery_address_line2) addrParts.push(order.delivery_address_line2)
  addrParts.push(order.delivery_city)
  if (order.delivery_county) addrParts.push(order.delivery_county)
  if (order.delivery_eircode) addrParts.push(order.delivery_eircode)
  lines.push(`Address:      ${addrParts.join(', ')}`)
  lines.push('')
  lines.push('Thank you for shopping with DeshiGrocery!')
  lines.push('')
  lines.push('──')
  lines.push('DeshiGrocery — Fresh Halal Groceries Delivered in Dublin')
  lines.push('info@deshigrocery.ie')
  return lines.join('\n')
}

/**
 * Send an order-confirmation email to the customer.
 * Non-blocking: logs failures but never throws.
 */
export async function sendOrderConfirmation(order: OrderForEmail): Promise<void> {
  const subject = `Order #${order.order_number} Received — DeshiGrocery`
  const text = buildText(order)

  // Attempt to send via Resend if configured.
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping email')
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DeshiGrocery <orders@deshigrocery.ie>',
        to: order.customer_email,
        subject,
        text,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[email] Resend error (${res.status}): ${body}`)
    } else {
      console.log(`[email] confirmation sent to ${order.customer_email}`)
    }
  } catch (err) {
    console.error('[email] send failed:', err instanceof Error ? err.message : err)
  }
}

/**
 * Send order confirmation by inserting into a mail_queue or other async
 * mechanism. Falls back to the synchronous attempt if no queue exists.
 * Non-blocking — never throws.
 */
export async function queueOrSendOrderConfirmation(orderId: string): Promise<void> {
  // Fetch a fresh snapshot using the service-role client (avoids RLS issues).
  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select(`
      order_number, customer_name, customer_email,
      payment_method, payment_status,
      total, subtotal, delivery_fee,
      delivery_date, delivery_slot,
      delivery_address_line1, delivery_address_line2,
      delivery_city, delivery_county, delivery_eircode
    `)
    .eq('id', orderId)
    .single()

  if (!order) {
    console.error(`[email] order ${orderId} not found for email`)
    return
  }

  const { data: items } = await admin
    .from('order_items')
    .select('product_name, weight_option, quantity, total_price')
    .eq('order_id', orderId)

  await sendOrderConfirmation({ ...order, items: items ?? [] })
}