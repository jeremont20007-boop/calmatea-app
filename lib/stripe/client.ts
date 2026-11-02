import Stripe from 'stripe'

let _stripe: Stripe | null = null

/**
 * Cliente de Stripe (solo servidor). Se crea de forma perezosa para que el
 * build no falle cuando STRIPE_SECRET_KEY no está definida en build time.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('Falta STRIPE_SECRET_KEY')
    _stripe = new Stripe(key, {
      apiVersion: '2026-05-27.dahlia',
      typescript: true,
    })
  }
  return _stripe
}
