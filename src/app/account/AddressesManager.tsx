'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Address } from '@/lib/types'
import { AddressForm } from './AddressForm'

const iconBtn = 'p-1.5 rounded-full hover:bg-white disabled:opacity-50 transition-colors'

export function AddressesManager({ initialAddresses }: { initialAddresses: Address[] }) {
  const [list, setList] = useState(initialAddresses)
  // null = closed | 'new' = adding | Address = editing that address
  const [formTarget, setFormTarget] = useState<Address | 'new' | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  function handleSaved(saved: Address) {
    setList((prev) => {
      const exists = prev.some((a) => a.id === saved.id)
      const next = exists ? prev.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...prev]
      if (!saved.is_default) return next
      return next.map((a) => (a.id === saved.id ? a : { ...a, is_default: false }))
    })
    setFormTarget(null)
  }

  async function setDefault(addr: Address) {
    setBusyId(addr.id)
    try {
      const res = await fetch(`/api/account/addresses/${addr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })
      const data = await res.json().catch(() => ({}) as { error?: string; address?: Address })
      if (!res.ok || !data.address) throw new Error(data.error || 'Could not update the address.')
      setList((prev) => prev.map((a) => ({ ...a, is_default: a.id === addr.id })))
      toast.success('Default address updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(addr: Address) {
    if (!window.confirm(`Delete the address at ${addr.address_line1}?`)) return
    setBusyId(addr.id)
    try {
      const res = await fetch(`/api/account/addresses/${addr.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string })
        throw new Error(data.error || 'Could not delete the address.')
      }
      setList((prev) => prev.filter((a) => a.id !== addr.id))
      toast.success('Address deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Delivery addresses <span className="text-sm font-medium text-gray-500">({list.length})</span>
        </h2>
        {!formTarget && (
          <Button size="sm" onClick={() => setFormTarget('new')}><Plus className="w-4 h-4" /> Add address</Button>
        )}
      </div>

      {formTarget && (
        <AddressForm
          address={formTarget === 'new' ? null : formTarget}
          isFirstAddress={list.length === 0}
          onCancel={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {list.length === 0 && !formTarget ? (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
          <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No delivery addresses yet</p>
          <p className="text-sm text-gray-500 mb-4">Save an address for faster checkout.</p>
          <Button size="sm" onClick={() => setFormTarget('new')}><Plus className="w-4 h-4" /> Add your first address</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((a) => (
            <div key={a.id} className={`rounded-lg border p-4 ${a.is_default ? 'border-[var(--primary)] bg-[var(--primary-lighter)]' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                {a.is_default ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)]"><Star className="w-3.5 h-3.5 fill-current" /> DEFAULT</span>
                ) : (
                  <button disabled={busyId === a.id} onClick={() => setDefault(a)} className="text-xs font-semibold text-gray-500 hover:text-[var(--primary)] disabled:opacity-50 px-1">Set default</button>
                )}
                <div className="flex items-center">
                  <button aria-label="Edit address" disabled={busyId === a.id} onClick={() => setFormTarget(a)} className={`${iconBtn} text-gray-400 hover:text-[var(--primary)]`}><Pencil className="w-4 h-4" /></button>
                  <button aria-label="Delete address" disabled={busyId === a.id} onClick={() => remove(a)} className={`${iconBtn} text-gray-400 hover:text-red-600`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="font-semibold text-gray-900">{a.full_name}</p>
              <p className="text-sm text-gray-600">{a.phone}</p>
              <p className="text-sm text-gray-700 mt-2 leading-snug">
                {a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ''}<br />
                {a.city}, {a.county}{a.eircode ? ` · ${a.eircode}` : ''}
              </p>
              {a.delivery_instructions && <p className="text-xs italic text-gray-500 mt-2">“{a.delivery_instructions}”</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}