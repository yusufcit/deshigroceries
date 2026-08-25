'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export function MarkPaidButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false)

  async function handleMarkPaid() {
    if (!confirm('Mark this Pay on Delivery order as paid?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Payment recorded as paid')
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as paid')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleMarkPaid}
      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
    >
      {busy ? 'Marking...' : 'Mark Payment as Received'}
    </button>
  )
}