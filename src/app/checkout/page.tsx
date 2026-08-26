import { Suspense } from 'react'
import CheckoutFlow from '@/components/checkout/CheckoutFlow'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background-alt)]" />}>
      <CheckoutFlow />
    </Suspense>
  )
}
