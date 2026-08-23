import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AccountDashboard } from './AccountDashboard'
import type { Customer, Address } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/account')
  }

  // Self-heal: some accounts (registered before the customers insert existed,
  // or where the post-signup insert silently failed) have no customers row.
  // NOTE: we take the row from the upsert's RETURNING payload rather than
  // re-selecting — Next.js memoizes identical GET fetches per render, so an
  // identical re-select would return the stale pre-insert result.
  let { data: customer } = await supabase
    .from('customers')
    .select('id, email, full_name, phone, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!customer) {
    const meta = (user.user_metadata ?? {}) as { full_name?: string; phone?: string }
    const { data: healed, error: healErr } = await supabase
      .from('customers')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: meta.full_name || user.email?.split('@')[0] || 'Customer',
        phone: meta.phone ?? null,
      })
      .select('id, email, full_name, phone, created_at')
      .single()
    if (healErr) console.error('[account] self-heal upsert failed:', healErr.message)
    customer = healed ?? null
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Account unavailable</h1>
          <p className="text-gray-600 mb-4">We could not load your account details. Please try again shortly.</p>
          <Link href="/" className="text-[var(--primary)] font-medium hover:underline">Back to homepage</Link>
        </div>
      </div>
    )
  }

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  return (
    <AccountDashboard
      customer={customer as Customer}
      addresses={(addresses ?? []) as Address[]}
      isAdmin={Boolean(adminUser)}
    />
  )
}