import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client — BYPASSES RLS. Server-only.
 * Used exclusively for operations the anon-key client cannot do under RLS:
 * counting orders per delivery slot (capacity) and trusted status updates
 * after admin authorization / Stripe verification.
 * Never import this file from a client component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      '[supabase] Service-role client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Add them to Vercel → Settings → Environment Variables (or .env.local locally), then redeploy.'
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
