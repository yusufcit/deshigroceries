import Stripe from 'stripe'

/**
 * Lazily-instantiated Stripe client.
 *
 * IMPORTANT: this must NOT be constructed at module scope (`export const
 * stripe = new Stripe(...)`). On Vercel, env vars like STRIPE_SECRET_KEY live
 * outside the repo — if the key is absent, an eager constructor would throw
 * "Neither apiKey nor config.authenticator provided" while merely EVALUATING
 * the chunk, crashing every route that transitively imports this file.
 *
 * With lazy init, only code paths that actually touch Stripe pay the cost,
 * and they get a clear, actionable error instead of an opaque SDK one.
 */
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      '[stripe] STRIPE_SECRET_KEY is not set. Add it to Vercel → Settings → Environment Variables (or .env.local locally), then redeploy.'
    )
  }
  _stripe = new Stripe(key, {
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true,
  })
  return _stripe
}

/**
 * Drop-in replacement for the previous eager client. All existing call sites
 * (`stripe.checkout.sessions.create(...)`, `stripe.webhooks.constructEvent(...)`)
 * keep working unchanged — the real client is built on first property access.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const real = getStripe() as unknown as Record<string | symbol, unknown>
    const value = Reflect.get(real, prop, receiver)
    return typeof value === 'function' ? (value as Function).bind(real) : value
  },
})