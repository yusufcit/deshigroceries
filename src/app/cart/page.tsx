'use client'

import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore()
  const subtotal = getSubtotal()
  const deliveryFee = subtotal >= 50 ? 0 : 4.99
  const total = subtotal + deliveryFee

  const handleUpdateQuantity = (productId: string, newQuantity: number, weightOption?: string) => {
    if (newQuantity < 1) return
    updateQuantity(productId, newQuantity, weightOption)
  }

  const handleRemoveItem = (productId: string, productName: string, weightOption?: string) => {
    removeItem(productId, weightOption)
    toast.success(`${productName} removed from cart`, {
      style: { background: '#059669', color: '#fff', borderRadius: '12px' },
    })
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background-alt)] flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fade-in-up">
          <div className="w-28 h-28 mx-auto mb-8 bg-gray-100 rounded-3xl flex items-center justify-center">
            <ShoppingBag className="w-14 h-14 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Looks like you haven't added anything yet. Let's change that!</p>
          <Link href="/shop">
            <Button size="lg" className="text-base">
              Start Shopping
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background-alt)]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
            </div>
            <Link href="/shop" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium text-sm flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <div
                key={`${item.product.id}-${item.weight_option || 'default'}`}
                className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex gap-4 md:gap-6">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 md:w-28 md:h-28 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.product.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-semibold text-gray-900 hover:text-[var(--primary)] transition-colors line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    {item.weight_option && (
                      <p className="text-sm text-gray-500 mt-1">
                        Weight: {item.weight_option}
                      </p>
                    )}
                    <p className="text-lg font-bold text-[var(--primary)] mt-2">
                      {formatPrice(item.selected_price)}
                    </p>

                    <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.weight_option
                            )
                          }
                          className="p-2.5 hover:bg-white rounded-l-xl transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="px-4 font-semibold text-gray-900 min-w-[2.5rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product.id,
                              item.quantity + 1,
                              item.weight_option
                            )
                          }
                          className="p-2.5 hover:bg-white rounded-r-xl transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          handleRemoveItem(
                            item.product.id,
                            item.product.name,
                            item.weight_option
                          )
                        }
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Item Total - Desktop */}
                  <div className="hidden md:flex flex-col items-end justify-between">
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(item.selected_price * item.quantity)}
                    </p>
                    <span className="text-xs text-gray-400">Item total</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.weight_option || 'default'}`}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-600 truncate max-w-[70%]">
                      {item.product.name} <span className="font-medium">x{item.quantity}</span>
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(item.selected_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">
                    {deliveryFee === 0 ? (
                      <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full text-sm">FREE</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>
                {subtotal < 50 && subtotal > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                    <p className="text-amber-800 font-medium">
                      Free delivery on orders over €50
                    </p>
                    <p className="text-amber-600 mt-1">
                      Add {formatPrice(50 - subtotal)} more!
                    </p>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Including delivery fee</p>
                </div>
              </div>

              <Link href="/checkout">
                <Button size="lg" className="w-full mt-6 text-base shadow-lg hover:shadow-xl">
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                <Shield className="w-4 h-4 text-green-500" />
                Secure checkout with Stripe
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
