import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

// Lazily create the Stripe client so the build doesn't fail when
// STRIPE_SECRET_KEY isn't available at build time.
export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
    stripeInstance = new Stripe(key, {
      apiVersion: '2026-05-27.dahlia',
      typescript: true,
    })
  }
  return stripeInstance
}
