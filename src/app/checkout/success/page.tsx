'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCartStore } from '@/lib/cart-store'
import { CheckCircle, ArrowRight, Package } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const clearCart = useCartStore((state) => state.clearCart)

  useEffect(() => {
    clearCart()

    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.order) {
            setOrderNumber(data.order.order_number)
          }
        })
        .catch((err) => console.error('Error fetching order:', err))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [orderId, clearCart])

  return (
    <div className="min-h-screen bg-[var(--background-alt)] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 mx-auto mb-8 bg-green-50 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-soft" />
            <span className="text-sm font-semibold text-green-700">Payment Successful</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Order Confirmed! 🎉
          </h1>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Thank you for your order! We're preparing your fresh halal groceries.
            You'll receive a confirmation email with your order details shortly.
          </p>

          {isLoading ? (
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-3" />
              <div className="h-6 bg-gray-200 rounded w-32 mx-auto" />
            </div>
          ) : orderNumber ? (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-green-100">
              <p className="text-sm text-gray-600 mb-1">Order Number</p>
              <p className="text-2xl font-bold text-[var(--primary)] tracking-tight">
                #{orderNumber}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Save this number for your records
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-2xl p-6 mb-8 border border-amber-100">
              <p className="text-sm text-amber-800 font-medium">
                Order placed successfully! Check your email for confirmation.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/account/orders">
              <Button variant="primary" size="lg" className="w-full text-base shadow-lg">
                Track Your Order
                <Package className="w-5 h-5" />
              </Button>
            </Link>

            <Link href="/shop">
              <Button variant="outline" size="lg" className="w-full text-base">
                Continue Shopping
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:info@deshigrocery.ie" className="text-[var(--primary)] hover:underline">
                info@deshigrocery.ie
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background-alt)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
