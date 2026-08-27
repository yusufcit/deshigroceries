'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/lib/cart-store'
import { calcDeliveryFee, type AvailableDay } from '@/lib/delivery-slots'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { type CheckoutCtx, type Step } from '@/components/checkout/types'
import AuthGate from '@/components/checkout/AuthGate'
import AddressStep from '@/components/checkout/AddressStep'
import SlotStep from '@/components/checkout/SlotStep'
import PaymentStep from '@/components/checkout/PaymentStep'
import toast from 'react-hot-toast'

const emptyAddr = { email: '', full_name: '', phone: '', address_line1: '', address_line2: '', city: 'Dublin', county: 'Dublin', eircode: '', delivery_instructions: '' }

export default function CheckoutFlow() {
  const router = useRouter()
  const sp = useSearchParams()
  const canceled = sp.get('canceled') === '1'
  const { items, getSubtotal, clearCart } = useCartStore()
  const subtotal = getSubtotal()
  const deliveryFee = calcDeliveryFee(subtotal)
  const total = Math.round((subtotal + deliveryFee) * 100) / 100

  const [user, setUser] = useState<any>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [step, setStep] = useState<Step>('auth')
  const [addr, setAddrState] = useState(emptyAddr)
  const [saveAddr, setSaveAddr] = useState(true)
  const [days, setDays] = useState<AvailableDay[]>([])
  const [selDate, setSelDate] = useState('')
  const [selSlot, setSelSlot] = useState('')
  const [pm, setPm] = useState<'card' | 'pay_on_delivery'>('pay_on_delivery')
  const [loading, setLoading] = useState(false)
  const [slotLoading, setSlotLoading] = useState(true)

  const setAddr = useCallback((p: Partial<typeof emptyAddr>) => setAddrState((a) => ({ ...a, ...p })), [])

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null)
      if (u) {
        fetch('/api/account/addresses').then((r) => r.json()).then((j) => {
          const d = j.addresses?.[0]
          if (d) {
            setAddrState({ email: u.email || '', full_name: d.full_name || '', phone: d.phone || '', address_line1: d.address_line1 || '', address_line2: d.address_line2 || '', city: d.city || 'Dublin', county: d.county || 'Dublin', eircode: d.eircode || '', delivery_instructions: d.delivery_instructions || '' })
            setSaveAddr(true)
          } else { setAddr({ email: u.email || '' }) }
        }).catch(() => {})
      }
      setUserLoaded(true)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [setAddr])

  useEffect(() => {
    if (step !== 'slot') return
    setSlotLoading(true)
    fetch('/api/delivery-slots').then((r) => r.json()).then((j) => setDays(j.days ?? [])).finally(() => setSlotLoading(false))
  }, [step])

    useEffect(() => {
    if (step === 'auth' && user && !isGuest) setStep('address')
  }, [step, user, isGuest, setStep])

  const slotOpts = days.flatMap((d) => d.slots).filter((s) => s.available)
  const selAvail = !!selDate && !!selSlot && slotOpts.some((s) => s.label === selSlot)
  const ctx: CheckoutCtx = {
    user, userLoaded, isGuest, step, setStep, addr, setAddr, saveAddr, setSaveAddr,
    days, slotLoading, selDate, setSelDate, selSlot, setSelSlot, selAvail, slotOpts,
    pm, setPm, loading, subtotal, deliveryFee, total, items, canceled,
  }

  async function submit() {
    if (loading || !selAvail) return
    setLoading(true)
    try {
      const payload = {
        items: items.map((it) => ({ productId: it.product.id, quantity: it.quantity, weightOption: it.weight_option })),
        paymentMethod: pm, deliveryDate: selDate, deliverySlot: selSlot,
        saveAddress: saveAddr && !!user,
        customer: { email: addr.email, full_name: addr.full_name, phone: addr.phone, address_line1: addr.address_line1, address_line2: addr.address_line2 || null, city: addr.city, county: addr.county, eircode: addr.eircode || null, delivery_instructions: addr.delivery_instructions || null },
      }
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!res.ok) { toast.error(j.error || 'Could not place your order.'); setLoading(false); return }

      if (pm === 'card') {
        // Redirect to Stripe WITHOUT clearing the cart. The cart must survive the
        // Stripe redirect so a cancelled/failed/expired payment leaves it intact.
        // The cart is only cleared once the Stripe webhook confirms payment as
        // PAID (handled on the success page via the order's payment_status).
        if (j.checkoutUrl) {
          window.location.href = j.checkoutUrl
        } else {
          // No session URL returned (shouldn't normally happen) — fall back to
          // the success page, which will clear the cart only if the order is
          // actually confirmed/paid.
          toast.success('Order placed successfully!')
          router.push(j.redirect || `/checkout/success?order_id=${j.orderId}`)
        }
        return
      }

      // Pay on Delivery: the order has been created and confirmed on the server —
      // it is now safe to clear the cart.
      clearCart()
      toast.success('Order placed successfully!')
      router.push(j.redirect || `/checkout/success?order_id=${j.orderId}`)
    } catch { toast.error('Something went wrong. Please try again.'); setLoading(false) }
  }

  if (items.length === 0) {
    return (
      <div className="text-center">
        <Link href="/shop"><Button size="lg">Go to Shop</Button></Link>
      </div>
    )
  }

  const banner = canceled ? (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-amber-800">
      <h2 className="font-bold text-amber-900 text-lg mb-1">Payment Not Completed</h2>
      <p className="text-sm">
        Your payment was not completed. Don&rsquo;t worry — your items are still
        saved in your cart. You can return to checkout and try again.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/cart" className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-xl border-2 border-amber-700 text-amber-900 hover:bg-amber-100 transition-colors">
          View Cart
        </Link>
      </div>
    </div>
  ) : null

  return (
    <div className="w-full">
      {banner}
      {step === 'auth' && !user && !isGuest ? (
        <AuthGate canceled={canceled} onGuest={() => { setIsGuest(true); setStep('address') }} onLogin={() => { setIsGuest(false); window.location.href = '/auth/login?next=/checkout' }} onRegister={() => { setIsGuest(false); window.location.href = '/auth/register?next=/checkout' }} />
      ) : step === 'auth' ? null : step === 'address' ? (
        <AddressStep ctx={ctx} onNext={() => setStep('slot')} />
      ) : step === 'slot' ? (
        <SlotStep ctx={ctx} onNext={() => setStep('payment')} onBack={() => setStep('address')} />
      ) : (
        <PaymentStep ctx={ctx} onBack={() => setStep('slot')} onSubmit={submit} />
      )}
    </div>
  )
}
