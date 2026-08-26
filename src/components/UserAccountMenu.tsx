'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * User account menu — shown in the header when a user is signed in.
 * Displays the user's initials in a circular avatar and a dropdown with
 * account links + logout.
 */
export function UserAccountMenu({ user }: { user: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [displayName, setDisplayName] = useState<string>(user?.user_metadata?.full_name || user?.user_metadata?.name || '')

  useEffect(() => {
    // Try to enrich the display name from the customers/profile table if metadata is empty.
    if (!displayName) {
      ;(async () => {
        try {
          const { data } = await createClient()
            .from('customers')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle()
          if (data?.full_name) setDisplayName(data.full_name as string)
        } catch {
          // ignore — fall back to email-derived name
        }
      })()
    }
  }, [user, displayName])

  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const email = user?.email || ''
  const name = displayName || email?.split('@')[0] || 'User'
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join('') || 'U'

  async function handleLogout() {
    if (busy) return
    setBusy(true)
    try {
      await createClient().auth.signOut()
      router.push('/')
      router.refresh()
    } catch {
      // Session may already be invalid; hard-navigate so the UI resets.
      window.location.href = '/'
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="w-9 h-9 bg-[var(--primary)] text-white rounded-full flex items-center justify-center text-sm font-bold uppercase tracking-wide shadow-[var(--shadow-green)]">
          {initials}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>

          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[var(--primary-lighter)] hover:text-[var(--primary)] transition-colors"
          >
            <User className="w-4 h-4" /> My Account
          </Link>

          <div className="border-t border-gray-100 my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={busy}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {busy ? 'Signing out…' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  )
}