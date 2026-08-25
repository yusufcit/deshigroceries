'use client'

import { Button } from '@/components/ui/Button'
import { MapPin, Calendar } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { FREE_DELIVERY_THRESHOLD, type AvailableDay } from '@/lib/delivery-slots'
import { type CheckoutCtx } from '@/components/checkout/types'

export default function PaymentStep({ ctx, onBack, onSubmit }: { ctx: CheckoutCtx; onBack: () => void; onSubmit: () => void }) {
  const { items, subtotal, deliveryFee, total, addr, selDate, selSlot, days, pm, setPm, loading, selAvail } = ctx
  const selectedDay: AvailableDay | undefined = days.find((d) => d.date === selDate)

  return (
    <div className="w-full">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: selections */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2"><MapPin className="w-5 h-5 text-[var(--primary)]" /> Delivery Address</h2>
            <p className="text-sm text-gray-500">{addr.full_name}, {addr.address_line1}{addr.address_line2 && `, ${addr.address_line2}`}, {addr.city}{addr.county ? ` (${addr.county})` : ''}</p>
            <button type="button" onClick={() => ctx.setStep('address')} className="text-sm text-[var(--primary)] hover:underline font-medium">Change</button>
          </div>

          <div className="bg-white rounded-3xl shadow border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2"><Calendar className="w-5 h-5 text-[var(--primary)]" /> Delivery Slot</h2>
            <p className="text-sm text-gray-500">{selectedDay?.label ?? selDate} · {selSlot}</p>
            <button type="button" onClick={() => ctx.setStep('slot')} className="text-sm text-[var(--primary)] hover:underline font-medium">Change</button>
          </div>

          <div className="bg-white rounded-3xl shadow border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer">
                <input type="radio" name="pm" checked={pm === 'card'} onChange={() => setPm('card')} className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
                <span className="text-2xl">💳</span>
                <div><span className="font-semibold text-gray-900">Pay by Card</span><p className="text-sm text-gray-500">Pay securely online now</p></div>
              </label>
              <label className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer">
                <input type="radio" name="pm" checked={pm === 'pay_on_delivery'} onChange={() => setPm('pay_on_delivery')} className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
                <span className="text-2xl">💵</span>
                <div><span className="font-semibold text-gray-900">Pay on Delivery</span><p className="text-sm text-gray-500">Pay when your order arrives</p></div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: summary */}
        <div>
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6">
              {items.map((it) => (
                <div key={`${it.product.id}-${it.weight_option || 'd'}`} className="flex justify-between text-sm">
                  <span className="text-gray-600">{it.product.name} {it.weight_option ? `(${it.weight_option}) ` : ''}× {it.quantity}</span>
                  <span className="font-medium">{formatPrice(it.selected_price * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Delivery</span><span className="font-medium">{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span></div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100"><span>Total</span><span>{formatPrice(total)}</span></div>
            </div>
            <Button size="lg" className="w-full mt-6" isLoading={loading} onClick={onSubmit} disabled={loading || !selAvail}>
              {pm === 'card' ? (loading ? 'Redirecting...' : 'Pay with Card') : (loading ? 'Placing order...' : 'Place Order')}
            </Button>
            {subtotal < FREE_DELIVERY_THRESHOLD && (
              <p className="mt-3 text-xs text-gray-500 text-center">Add {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery</p>
            )}
          </div>
          <div className="mt-6">
            <button type="button" onClick={onBack} className="text-gray-600 hover:text-gray-900 font-medium">Back</button>
          </div>
        </div>
      </div>
    </div>
  )
}
