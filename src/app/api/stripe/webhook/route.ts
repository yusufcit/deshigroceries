import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe-server'
import { createAdminClient } from '@/lib/supabase/admin'

async function fulfillOrder(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id
  if (!orderId || session.payment_status !== 'paid') return
  const admin = createAdminClient()
  // Idempotent: only flip pending → paid/processing
  await admin
    .from('orders')
    .update({ payment_status: 'paid', status: 'processing', payment_intent_id: session.payment_intent })
    .eq('id', orderId)
    .eq('payment_status', 'pending')
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
  }

  return NextResponse.json({ received: true })
}
