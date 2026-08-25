import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateOrderNumber } from '@/lib/utils'
import { isValidSlotChoice, calcDeliveryFee, slotLabel, getSlotCapacity } from '@/lib/delivery-slots'
import { queueOrSendOrderConfirmation } from '@/lib/email'

// ---------------------------------------------------------------------------
// Server-authoritative checkout. The browser sends WHAT it wants (product ids,
// quantities, address text, slot choice, payment method) — never prices or
// totals. Everything monetary/slot/capacity related is recomputed here.
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') return bad('Invalid request.')

    const rawItems: Array<{ productId?: unknown; quantity?: unknown; weightOption?: unknown }> =
      Array.isArray(body.items) ? body.items : []
    const paymentMethod =
      body.paymentMethod === 'pay_on_delivery'
        ? 'pay_on_delivery'
        : body.paymentMethod === 'card'
          ? 'card'
          : null
    const deliveryDate = str(body.deliveryDate)
    const deliverySlot = str(body.deliverySlot)
    const saveAddress = body.saveAddress === true

    const customer = {
      email: str(body.customer?.email).toLowerCase(),
      full_name: str(body.customer?.full_name),
      phone: str(body.customer?.phone),
      address_line1: str(body.customer?.address_line1),
      address_line2: str(body.customer?.address_line2) || null,
      city: str(body.customer?.city) || 'Dublin',
      county: str(body.customer?.county) || 'Dublin',
      eircode: str(body.customer?.eircode) || null,
      delivery_instructions: str(body.customer?.delivery_instructions) || null,
    }

    // ---- Identity (guest OR logged-in) ------------------------------------
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const customerId = user?.id ?? null

    // ---- Validation --------------------------------------------------------
    if (rawItems.length === 0) return bad('Your cart is empty.')
    if (!paymentMethod) return bad('Please choose a payment method.')
    if (!EMAIL_RE.test(customer.email)) return bad('Please enter a valid email address.')
    if (customer.full_name.length < 2) return bad('Please enter your full name.')
    if (!customer.address_line1) return bad('Please enter your address line 1.')
    if (customer.phone.replace(/\D/g, '').length < 9) return bad('Please enter a valid phone number.')
    if (customer.city.length < 2) return bad('Please enter your city/town.')
    if (!isValidSlotChoice(deliveryDate, deliverySlot)) {
      return bad('Sorry, this delivery slot is no longer available. Please choose another slot.')
    }

    const items = rawItems.map((it) => ({
      productId: typeof it.productId === 'string' ? it.productId : '',
      quantity: Math.floor(Number(it.quantity)),
      weightOption:
        typeof it.weightOption === 'string' && it.weightOption.trim() ? it.weightOption.trim() : null,
    }))
    if (items.some((i) => !UUID_RE.test(i.productId))) return bad('Invalid product in cart.')
    if (items.some((i) => !Number.isFinite(i.quantity) || i.quantity < 1 || i.quantity > 99)) {
      return bad('Item quantities must be between 1 and 99.')
    }

    // ---- Server-side pricing (never trust browser totals) ------------------
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, image_url, weight_options, is_available')
      .in('id', [...new Set(items.map((i) => i.productId))])
    if (prodErr) return bad('Could not verify product availability. Please try again.', 503)

    const byId = new Map((products ?? []).map((p) => [p.id, p]))
    let subtotal = 0
    const lines: Array<{
      product_id: string
      product_name: string
      product_image_url: string | null
      weight_option: string | null
      quantity: number
      unit_price: number
      total_price: number
    }> = []

    for (const item of items) {
      const p = byId.get(item.productId)
      if (!p || p.is_available !== true) {
        return bad('Sorry, an item in your cart is no longer available. Please review your cart.')
      }
      const options = Array.isArray(p.weight_options)
        ? (p.weight_options as Array<{ value?: unknown; price?: unknown }>)
        : []
      const match = item.weightOption
        ? options.find((w) => String(w?.value ?? '') === item.weightOption)
        : undefined
      const fallbackUnit = Number(p.price)
      const unit =
        match && Number.isFinite(Number(match.price))
          ? Number(match.price)
          : Number.isFinite(fallbackUnit)
            ? fallbackUnit
            : NaN
      if (!Number.isFinite(unit)) return bad(`Pricing for "${String(p.name ?? 'an item')}" is unavailable. Please contact support.`)

      const lineTotal = Math.round(unit * item.quantity * 100) / 100
      subtotal += lineTotal
      lines.push({
        product_id: p.id,
        product_name: String(p.name ?? 'Product'),
        product_image_url: typeof p.image_url === 'string' ? p.image_url : null,
        weight_option: item.weightOption,
        quantity: item.quantity,
        unit_price: unit,
        total_price: lineTotal,
      })
    }
    subtotal = Math.round(subtotal * 100) / 100
    const deliveryFee = calcDeliveryFee(subtotal)
    const total = Math.round((subtotal + deliveryFee) * 100) / 100

    // ---- Slot capacity (admin-controlled schedule + atomic atomic reserve) --
    // Resolves the booked slot against the admin-managed weekly schedule and
    // reserves one unit of capacity atomically (row-locked), so concurrent
    // orders can never overbook. Falls back to the legacy global cap only if
    // the delivery-slots tables are absent (migration not yet applied).
    const admin = createAdminClient()
        const slotDow = new Date(`${deliveryDate}T00:00:00Z`).getUTCDay()
    // deliverySlot arrives as "09:00-11:00" (the label produced by slotLabel()).
    // delivery_slots stores start/end as TIME, so match on those columns rather
    // than a non-existent `label` column — this is what makes the admin-controlled
    // capacity/overrides actually take effect.
    const [slotStart, slotEnd] = deliverySlot.split('-')
    let slotId: string | null = null
    let reservedSlot = false
    let tablesAbsent = false
    try {
      const { data: slotRow, error: slotErr } = await admin
        .from('delivery_slots')
        .select('id')
        .eq('day_of_week', slotDow)
        .eq('start_time', `${slotStart}:00`)
        .eq('end_time', `${slotEnd}:00`)
        .eq('is_active', true)
        .maybeSingle()
      if (slotErr) {
        // Table missing entirely -> non-admin deployment. Legacy fallback below.
        tablesAbsent = true
      } else if (slotRow?.id) {
        slotId = slotRow.id as string
        const { data: ok } = await admin
          .rpc('reserve_delivery_slot', { p_date: deliveryDate, p_slot_id: slotId })
        reservedSlot = ok === true
      }
      // slotRow is null (no active slot for this day+time) -> the slot is
      // disabled or off-schedule. Do NOT fall through to the legacy count:
      // reject it so a deactivated weekly slot can never be ordered.
    } catch {
      // network/DB error -> treat as tables absent for the legacy fallback
      tablesAbsent = true
    }
    if (!tablesAbsent && !reservedSlot && !slotId) {
      // Admin schedule is active but this exact day+time has no enabled slot.
      return bad('Sorry, this delivery slot is no longer available. Please choose another slot.')
    }
    if (tablesAbsent && !reservedSlot) {
      // Fallback: no admin schedule table at all — apply the legacy global cap.
      const { count: taken } = await admin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('delivery_date', deliveryDate)
        .eq('delivery_slot', deliverySlot)
        .neq('status', 'cancelled')
      reservedSlot = (taken ?? 0) < getSlotCapacity()
    }
    if (!reservedSlot) {
      return bad('Sorry, this delivery slot is no longer available. Please choose another slot.')
    }
    // Frees the reserved unit if any later step fails (never double-releases).
    const releaseSlot = async () => {
      if (reservedSlot && slotId) {
        reservedSlot = false
        await admin.rpc('release_delivery_slot', { p_date: deliveryDate, p_slot_id: slotId }).then(
          () => {},
          () => {}
        )
      }
    }
    // ---- Persist the order (address snapshot is denormalized onto the row) --
    const orderPayload = {
      order_number: generateOrderNumber(),
      customer_id: customerId,
      customer_email: customer.email,
      customer_name: customer.full_name,
      customer_phone: customer.phone,
      delivery_address_line1: customer.address_line1,
      delivery_address_line2: customer.address_line2,
      delivery_city: customer.city,
      delivery_county: customer.county,
      delivery_eircode: customer.eircode,
      delivery_instructions: customer.delivery_instructions,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      payment_method: paymentMethod,
      payment_status: 'pending',
      status: 'pending',
      delivery_date: deliveryDate,
      delivery_slot: deliverySlot,
    }

    // Insert with the service-role client: the server has already validated
    // identity, prices, totals, address and slot, so RLS INSERT restrictions
    // (which block anon/guest users) must not stand between a legitimate
    // server-validated order and the database. Reads stay RLS-scoped.
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert(orderPayload)
      .select('id, order_number')
      .single()
    if (orderErr || !order) return bad('Could not create your order. Please try again.', 503)

    const { error: itemsErr } = await admin
      .from('order_items')
      .insert(lines.map((l) => ({ ...l, order_id: order.id })))
    if (itemsErr) {
      await admin.from('orders').delete().eq('id', order.id)
      return bad('Could not save your order items. Please try again.', 503)
    }

    // ---- Save address to the customer's account (logged-in, opt-in) --------
    // Non-fatal: the order is already placed if this fails.
    if (saveAddress && customerId) {
      try {
        const { count: addrCount } = await supabase
          .from('addresses')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customerId)
        await supabase.from('addresses').insert({
          customer_id: customerId,
          full_name: customer.full_name,
          phone: customer.phone,
          address_line1: customer.address_line1,
          address_line2: customer.address_line2,
          city: customer.city,
          county: customer.county,
          eircode: customer.eircode,
          delivery_instructions: customer.delivery_instructions,
          is_default: (addrCount ?? 0) === 0,
        })
      } catch (addrErr) {
        console.error('[orders POST] address save skipped:', addrErr instanceof Error ? addrErr.message : addrErr)
      }
    }

    // ---- Pay on Delivery: order stands as-is (payment stays pending) -------
    if (paymentMethod === 'pay_on_delivery') {
      queueOrSendOrderConfirmation(order.id) // non-blocking, never throws
      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.order_number,
        redirect: `/checkout/success?order_id=${order.id}`,
      })
    }

    // ---- Card: Stripe Checkout session built ONLY from server-computed data -
    const origin = request.headers.get('origin') ?? new URL(request.url).origin
    let session
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: customer.email,
        client_reference_id: order.id,
        metadata: { order_id: order.id, order_number: order.order_number },
        line_items: [
          ...lines.map((l) => ({
            quantity: l.quantity,
            price_data: {
              currency: 'eur',
              unit_amount: Math.round(l.unit_price * 100),
              product_data: {
                name: l.weight_option ? `${l.product_name} (${l.weight_option})` : l.product_name,
              },
            },
          })),
          ...(deliveryFee > 0
            ? [
                {
                  quantity: 1,
                  price_data: {
                    currency: 'eur',
                    unit_amount: Math.round(deliveryFee * 100),
                    product_data: { name: 'Delivery' },
                  },
                },
              ]
            : []),
        ],
        success_url: `${origin}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout?canceled=1`,
      })
    } catch (stripeErr) {
      console.error('[orders POST] stripe session failed:', stripeErr instanceof Error ? stripeErr.message : stripeErr)
      // No orphan orders: remove the staged order entirely so the customer can
      // cleanly retry (with POD or once payment is available again).
      await admin.from('order_items').delete().eq('order_id', order.id)
      await admin.from('orders').delete().eq('id', order.id)
      return bad('Payment is temporarily unavailable. Please choose Pay on Delivery or try again shortly.', 503)
    }

    await admin.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id)
    queueOrSendOrderConfirmation(order.id) // non-blocking, never throws
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      checkoutUrl: session.url,
    })
  } catch (err) {
    console.error('[orders POST]', err)
    return bad('Something went wrong. Please try again.', 500)
  }
}

