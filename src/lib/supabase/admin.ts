import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client — BYPASSES RLS. Server-only.
 * Used exclusively for operations the anon-key client cannot do under RLS:
 * counting orders per delivery slot (capacity) and trusted status updates
 * after admin authorization / Stripe verification.
 * Never import this file from a client component.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
