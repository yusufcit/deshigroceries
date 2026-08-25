'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCartStore } from '@/lib/cart-store'
import OrderDetails from './OrderDetails'
import { type Order } from './types'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const clearCart = useCartStore((state) => state.clearCart)

  useEffect(() => {
    // Cart was already cleared in CheckoutFlow after order creation.
    // This is a safety net in case the user refreshes the success page.
    clearCart()
    if (!orderId) { setLoading(false); setFetchError(true); return }
    fetch(`/api/orders/${orderId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        if (data.order) setOrder(data.order as Order)
        else setFetchError(true)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [orderId, clearCart])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading your order…</p>
      </div>
    )
  }

  if (fetchError || !order) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-600 mb-6">Your order was placed successfully. Please check your email for the confirmation details.</p>
        <Link href="/"><Button size="lg">Continue Shopping</Button></Link>
      </div>
    )
  }

  const isPOD = order.payment_method === 'pay_on_delivery'
  const paid = order.payment_status === 'paid'
  const title = isPOD ? 'Order Received!' : paid ? 'Payment Successful!' : 'Order Confirmed!'
  const subtitle = `Thank you, ${order.customer_name}.`
  const msg = isPOD
    ? 'Your order has been placed. Please have your payment ready when your groceries arrive.'
    : paid
      ? 'Your payment was successful and your order is being prepared for delivery.'
      : 'Your order is confirmed and awaiting payment confirmation.'

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
      {/* Icon */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-lg text-gray-600">{subtitle}</p>
        <p className="text-gray-500 mt-1 max-w-md mx-auto">{msg}</p>

        {order.order_number && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Order #{order.order_number}</span>
          </div>
        )}
      </div>

      <OrderDetails order={order} />

      <div className="mt-8 text-center">
        <Link href="/"><Button variant="primary" size="lg" className="text-base shadow-lg">Continue Shopping</Button></Link>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">
          Need help? Contact us at{' '}
          <a href="mailto:info@deshigrocery.ie" className="text-[var(--primary)] hover:underline">
            info@deshigrocery.ie
          </a>
        </p>
      </div>
    </div>
  )
}

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-[var(--background-alt)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Suspense fallback={<div className="text-center py-16"><div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-gray-600">Loading…</p></div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  )
}
