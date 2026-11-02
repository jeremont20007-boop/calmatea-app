// Server-side source of truth for prices. Never trust prices sent by the browser.
export const PREMIUM_PRICE_ARS = {
  conductor: 2990,
  propietario: 3990,
} as const

export function premiumPriceFor(role: string | null | undefined): number {
  return role === 'propietario' ? PREMIUM_PRICE_ARS.propietario : PREMIUM_PRICE_ARS.conductor
}

// MercadoPago payment ids are numeric. Reject anything else before using it in a URL.
export function isValidMpPaymentId(id: unknown): id is string | number {
  return (typeof id === 'string' || typeof id === 'number') && /^\d{1,30}$/.test(String(id))
}
