'use client'

import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'
import { type CheckoutCtx } from '@/components/checkout/types'

const IN = 'w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow'
const LB = 'block text-sm font-medium text-gray-700 mb-1.5'

export default function AddressStep({ ctx, onNext }: { ctx: CheckoutCtx; onNext: () => void }) {
    const { addr, setAddr, user, saveAddr, setSaveAddr } = ctx
  const readyAddress = !!addr.email && !!addr.full_name && !!addr.address_line1 && addr.city.length >= 2 && addr.phone.replace(/\D/g, '').length >= 9
  return (
    <div className="w-full">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Delivery Address</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <div><label className={LB}>Email *</label><input type="email" required className={IN} value={addr.email} onChange={(e) => setAddr({ email: e.target.value.toLowerCase() })} placeholder="you@example.com" /></div>
          <div><label className={LB}>Full Name *</label><input type="text" required className={IN} value={addr.full_name} onChange={(e) => setAddr({ full_name: e.target.value })} placeholder="Jane Doe" /></div>
          <div><label className={LB}>Phone *</label><input type="tel" required className={IN} value={addr.phone} onChange={(e) => setAddr({ phone: e.target.value })} placeholder="+353 87 123 4567" /></div>
          <div className="md:col-span-2"><label className={LB}>Address Line 1 *</label><input type="text" required className={IN} value={addr.address_line1} onChange={(e) => setAddr({ address_line1: e.target.value })} placeholder="123 Main Street" /></div>
          <div className="md:col-span-2"><label className={LB}>Address Line 2</label><input type="text" className={IN} value={addr.address_line2} onChange={(e) => setAddr({ address_line2: e.target.value })} placeholder="Apartment, unit, etc. (optional)" /></div>
          <div><label className={LB}>City *</label><input type="text" required className={IN} value={addr.city} onChange={(e) => setAddr({ city: e.target.value })} /></div>
          <div><label className={LB}>County</label><input type="text" className={IN} value={addr.county} onChange={(e) => setAddr({ county: e.target.value })} /></div>
          <div><label className={LB}>Eircode</label><input type="text" className={IN} value={addr.eircode} onChange={(e) => setAddr({ eircode: e.target.value.toUpperCase() })} placeholder="D01 ABC1" /></div>
          <div className="md:col-span-2"><label className={LB}>Delivery Instructions</label><textarea rows={3} className={IN} placeholder="Leave at front door, ring bell, etc." value={addr.delivery_instructions} onChange={(e) => setAddr({ delivery_instructions: e.target.value })} /></div>
        </div>
        {user && (
          <div className="mt-6 flex items-start gap-3">
            <input id="saveAddress" type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} />
            <label htmlFor="saveAddress" className="text-sm text-gray-700">
              Save this delivery address to my account for next time
            </label>
          </div>
        )}
        <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
          <button type="button" onClick={() => ctx.setStep('auth')} className="text-gray-600 hover:text-gray-900 font-medium">Back</button>
          <Button size="lg" onClick={onNext} disabled={!readyAddress}>
            Continue to Delivery Slot <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
