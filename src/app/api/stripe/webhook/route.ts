import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe-server'
import { createAdminClient } from '@/lib/supabase/admin'
import { queueOrSendOrderConfirmation } from '@/lib/email'

// Release the temporary delivery-slot reservation (if any) for a card order
// that did NOT complete payment — frees the slot back to other customers.
async function releaseReservationForOrder(admin: ReturnType<typeof createAdminClient>, orderId: string) {
  const { data: res } = await admin
    .from('delivery_slot_reservations')
    .select('id')
    .eq('order_id', orderId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (res?.id) {
    await admin.rpc('release_delivery_slot_reservation', { p_reservation_id: res.id }).then(
      () => {},
      () => {}
    )
  }
}

// Convert the temporary reservation to permanent capacity and, if the slot was
// actually confirmed, mark the order paid and email the customer.
async function fulfillOrder(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id
  if (!orderId) return
  // Only a truly paid session can convert the temporary reservation to
  // permanent capacity. (Async/uncaptured checkouts are handled elsewhere.)
  if (session.payment_status !== 'paid') return
  const admin = createAdminClient()

  const { data: order } = await admin
    .from('orders')
    .select('id, payment_status, delivery_slot_id')
    .eq('id', orderId)
    .single()
  if (!order) return

  // Idempotent: the payment has already been recorded.
  if (order.payment_status === 'paid') return

  // The Stripe session is authoritative for the PAYMENT, but the delivery slot
  // must also be safely reserved. Confirm the reservation first — this converts
  // the 15-minute hold into permanent capacity (atomically, never overbooking).
  let slotConfirmed = true
  if (order.delivery_slot_id) {
    const { data: res } = await admin
      .from('delivery_slot_reservations')
      .select('id')
      .eq('order_id', orderId)
      .eq('delivery_slot_id', order.delivery_slot_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (res?.id) {
      const { data: confirmed } = await admin.rpc('confirm_delivery_slot_reservation', {
        p_reservation_id: res.id,
      })
      slotConfirmed = confirmed === true
    }
  }

  const paidPatch = {
    payment_status: 'paid',
    payment_intent_id: session.payment_intent,
    status: slotConfirmed ? 'processing' : 'requires_review', // overbook guard
  }
  // Flip pending -> paid/processing only when THIS request is the first to do
  // so, guarding against duplicate emails on webhook replays.
  const { data, error } = await admin
    .from('orders')
    .update(paidPatch)
    .eq('id', orderId)
    .eq('payment_status', 'pending')
    .select('id')

  if (!slotConfirmed) {
    // Payment succeeded but the slot could not be reserved (reservation expired
    // or the slot is now full). We must NOT overbook, and we must NOT silently
    // lose the customer's payment — flag it for a human + admin review.
    console.error(
      `[stripe] order ${orderId} paid but delivery slot was unavailable — flagged requires_review`
    )
  }

  // Only send the confirmation email when THIS request flipped pending → paid
  // and the order is being fulfilled normally (not flagged for review).
  if (!error && Array.isArray(data) && data.length > 0 && !slotConfirmed) {
    // Skipped on purpose: a payment that couldn't be wired to a slot shouldn't
    // get an automated confirmation email — a human will resolve it first.
    console.log(`[stripe] order ${orderId} awaiting manual review — no email sent`)
  } else if (!error && Array.isArray(data) && data.length > 0) {
    queueOrSendOrderConfirmation(orderId) // non-blocking, never throws
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature ?? '',
      process.env.STRIPE_WEBHOOK_SECRET ?? ''
    )
  } catch {
    // Unsigned/unverifiable requests are rejected
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    await fulfillOrder(event.data.object as Stripe.Checkout.Session)
  } else if (event.type === 'checkout.session.expired') {
    // Customer abandoned/cancelled checkout (or never returned). Release the
    // temporary slot reservation so the slot becomes bookable again.
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    if (orderId) {
      await releaseReservationForOrder(createAdminClient(), orderId)
    }
  } else if (event.type === 'checkout.session.async_payment_failed') {
    // Stripe reported a failed payment. Keep the cart/order intact and mark the
    // payment attempt failed while releasing the slot reservation.
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    if (orderId) {
      const admin = createAdminClient()
      await releaseReservationForOrder(admin, orderId)
      await admin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId)
        .eq('payment_status', 'pending')
        .then(
          () => {},
          () => {}
        )
    }
  }

  return NextResponse.json({ received: true })
}
