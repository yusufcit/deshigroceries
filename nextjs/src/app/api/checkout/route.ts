import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import { createClient } from '@/lib/supabase/server'
import { generateOrderNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { items, customer, subtotal, deliveryFee, total } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    const supabase = await createClient()

    // Generate unique order number
    const orderNumber = generateOrderNumber()

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: customer.email,
        customer_name: customer.full_name,
        customer_phone: customer.phone,
        delivery_address_line1: customer.address_line1,
        delivery_address_line2: customer.address_line2,
        delivery_city: customer.city,
        delivery_eircode: customer.eircode,
        delivery_instructions: customer.delivery_instructions,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment_status: 'pending',
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_image_url: item.product.image_url,
      weight_option: item.weight_option || null,
      quantity: item.quantity,
      unit_price: item.selected_price,
      total_price: item.selected_price * item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items error:', itemsError)
      // Delete the order if items fail
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Create Stripe checkout session
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(item.selected_price * 100), // Convert to cents
        product_data: {
          name: item.product.name,
          description: item.weight_option || undefined,
          images: item.product.image_url ? [item.product.image_url] : [],
        },
      },
      quantity: item.quantity,
    }))

    // Add delivery fee as line item
    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(deliveryFee * 100),
          product_data: {
            name: 'Delivery Fee',
            description: 'Home delivery to Dublin',
          },
        },
        quantity: 1,
      })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?cancelled=true`,
      customer_email: customer.email,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
      },
    })

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
