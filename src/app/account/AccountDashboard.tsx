'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Customer, Address } from '@/lib/types'
import { AddressesManager } from './AddressesManager'

export function AccountDashboard({
  customer,
  addresses,
  isAdmin,
}: {
  customer: Customer
  addresses: Address[]
  isAdmin: boolean
}) {
  const [fullName, setFullName] = useState(customer.full_name ?? '')
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [saving, setSaving] = useState(false)
  const input =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone }),
      })
      const data = await res.json().catch(() => ({}) as { error?: string })
      if (!res.ok) throw new Error(data.error || 'Could not save your details.')
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const label = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
            <p className="text-sm text-gray-600">{customer.email}</p>
          </div>
          {isAdmin && (
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-3 py-2 rounded-lg transition-colors">
              <ShieldCheck className="w-4 h-4" /> Admin Dashboard
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Contact details</h2>
          <p className="text-sm text-gray-500 mb-5">We use these to confirm orders and delivery updates.</p>
          <form onSubmit={saveProfile} noValidate className="grid sm:grid-cols-2 gap-4">
            <label className="block"><span className={label}>Full name</span>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} /></label>
            <label className="block"><span className={label}>Phone number</span>
              <input type="tel" required placeholder="+353 87 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} /></label>
            <div className="sm:col-span-2"><Button type="submit" isLoading={saving}>Save changes</Button></div>
          </form>
        </section>

        <AddressesManager initialAddresses={addresses} />

        <p className="text-center text-xs text-gray-400">
          Member since {new Date(customer.created_at).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}