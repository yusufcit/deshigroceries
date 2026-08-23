'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Address } from '@/lib/types'

interface FormState {
  full_name: string; phone: string; address_line1: string; address_line2: string
  city: string; county: string; eircode: string
  delivery_instructions: string; is_default: boolean
}

function toFormState(a: Address | null, isFirst: boolean): FormState {
  return {
    full_name: a?.full_name ?? '', phone: a?.phone ?? '',
    address_line1: a?.address_line1 ?? '', address_line2: a?.address_line2 ?? '',
    city: a?.city ?? 'Dublin', county: a?.county ?? 'Dublin', eircode: a?.eircode ?? '',
    delivery_instructions: a?.delivery_instructions ?? '',
    is_default: a ? Boolean(a.is_default) : isFirst,
  }
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'

export function AddressForm({
  address,
  isFirstAddress,
  onCancel,
  onSaved,
}: {
  address: Address | null
  isFirstAddress: boolean
  onCancel: () => void
  onSaved: (saved: Address) => void
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(address, isFirstAddress))
  const [saving, setSaving] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(
        address ? `/api/account/addresses/${address.id}` : '/api/account/addresses',
        {
          method: address ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      )
      const data = (await res.json().catch(() => ({}))) as { error?: string; address?: Address }
      if (!res.ok || !data.address) throw new Error(data.error || 'Could not save the address.')
      toast.success(address ? 'Address updated' : 'Address added')
      onSaved(data.address)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const label = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md border border-gray-100 p-5 mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{address ? 'Edit address' : 'Add a delivery address'}</h3>
        <button type="button" onClick={onCancel} aria-label="Cancel" className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block"><span className={label}>Recipient name *</span>
          <input required value={form.full_name} onChange={(e) => set('full_name', e.target.value)} className={inputClass} /></label>
        <label className="block"><span className={label}>Contact phone *</span>
          <input type="tel" required placeholder="+353 87 123 4567" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} /></label>
        <label className="block sm:col-span-2"><span className={label}>Address line 1 *</span>
          <input required value={form.address_line1} onChange={(e) => set('address_line1', e.target.value)} className={inputClass} /></label>
        <label className="block sm:col-span-2"><span className={label}>Address line 2 <span className="text-gray-400">(optional)</span></span>
          <input value={form.address_line2} onChange={(e) => set('address_line2', e.target.value)} className={inputClass} /></label>
        <label className="block"><span className={label}>City / Town</span>
          <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} /></label>
        <label className="block"><span className={label}>County</span>
          <input value={form.county} onChange={(e) => set('county', e.target.value)} className={inputClass} /></label>
        <label className="block"><span className={label}>Eircode <span className="text-gray-400">(optional)</span></span>
          <input placeholder="D02 X285" maxLength={10} value={form.eircode} onChange={(e) => set('eircode', e.target.value)} className={inputClass} /></label>
        <div />
        <label className="sm:col-span-2 block"><span className={label}>Delivery instructions <span className="text-gray-400">(optional)</span></span>
          <textarea rows={2} placeholder="Gate code, safe place, buzzer number…" value={form.delivery_instructions} onChange={(e) => set('delivery_instructions', e.target.value)} className={inputClass} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={form.is_default} onChange={(e) => set('is_default', e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
        Set as my default delivery address
      </label>
      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" isLoading={saving}>{address ? 'Save changes' : 'Add address'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}