import Stripe from 'stripe'

let client: Stripe | null = null

// Se crea recién cuando se usa, para que el build no falle si
// STRIPE_SECRET_KEY no está configurada (Stripe hoy no se usa desde la UI).
export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-05-27.dahlia',
      typescript: true,
    })
  }
  return client
}
