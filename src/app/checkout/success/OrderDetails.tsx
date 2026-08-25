'use client'

import { MapPin, Calendar, ShoppingCart, CreditCard, DollarSign } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { type Order } from './types'

export default function OrderDetails({ order }: { order: Order }) {
  const isPOD = order.payment_method === 'pay_on_delivery'
  const paid = order.payment_status === 'paid'

  return (
    <>
      {/* Payment */}
      <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          {isPOD ? <DollarSign className="w-5 h-5 text-green-600" /> : <CreditCard className="w-5 h-5 text-blue-600" />}
          <div>
            <span className="font-semibold text-gray-900">Payment &mdash; </span>
            <span className="text-gray-700">{isPOD ? 'Pay on Delivery' : 'Card'}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 pl-8">
          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
            paid
              ? 'bg-green-100 text-green-800'
              : isPOD
                ? 'bg-amber-100 text-amber-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}>
            {paid ? 'Paid' : 'Pending'}
          </span>
          {isPOD && (
            <span className="text-xs text-gray-500">Pay when your order arrives</span>
          )}
        </div>
      </div>

      {/* Delivery Slot */}
      <div className="flex items-start gap-4 mb-6">
        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
        <div>
          <p className="font-semibold text-gray-900">Delivery Slot</p>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(order.delivery_date).toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })} &middot; {order.delivery_slot.replace('-', '–')}
          </p>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="flex items-start gap-4 mb-6">
        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
        <div>
          <p className="font-semibold text-gray-900">Delivery Address</p>
          <p className="text-sm text-gray-600 mt-1">
            {order.customer_name}, {order.delivery_address_line1}
            {order.delivery_address_line2 && `, ${order.delivery_address_line2}`}, {order.delivery_city}
            {order.delivery_county && ` (${order.delivery_county})`}{order.delivery_eircode && ` &middot; ${order.delivery_eircode}`}
          </p>
          {order.delivery_instructions && <p className="text-sm text-gray-500 mt-1">Note: {order.delivery_instructions}</p>}
        </div>
      </div>

      {/* Items */}
      <div className="mb-6">
        <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Items</p>
        <div className="space-y-2">
          {order.items.map((it, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{it.product_name}{it.weight_option ? ` (${it.weight_option})` : ''} &times; {it.quantity}</span>
              <span className="font-medium">{formatPrice(it.total_price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
        <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{order.delivery_fee === 0 ? 'FREE' : formatPrice(order.delivery_fee)}</span></div>
        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100"><span>Total</span><span>{formatPrice(order.total)}</span></div>
      </div>
    </>
  )
}
