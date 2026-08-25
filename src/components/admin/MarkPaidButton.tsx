'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BanknoteIcon, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export function MarkPaidButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const markPaid = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Could not record payment.')
        return
      }
      toast.success('Payment recorded as received')
      setDone(true)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
        <Check className="w-3.5 h-3.5" /> Recorded
      </span>
    )
  }

  return (
    <button
      onClick={markPaid}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
    >
      <BanknoteIcon className="w-3.5 h-3.5" />
      {isLoading ? 'Saving…' : 'Mark Payment as Received'}
    </button>
  )
}
