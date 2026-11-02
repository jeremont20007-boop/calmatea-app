import { timingSafeEqual } from 'crypto'

/** Precios del plan Premium (ARS / mes). Fuente de verdad del lado del servidor. */
export const PREMIUM_PRICE_ARS = {
  conductor: 2990,
  propietario: 3990,
} as const

export function premiumPriceFor(role: string | null | undefined): number {
  return role === 'conductor' ? PREMIUM_PRICE_ARS.conductor : PREMIUM_PRICE_ARS.propietario
}

/** Compara dos strings en tiempo constante (para tokens de webhooks). */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/** Verifica que un pago aprobado cubra el monto esperado en ARS. */
export function amountCovers(paid: unknown, expected: number, currency?: unknown): boolean {
  if (currency !== undefined && currency !== 'ARS') return false
  const n = typeof paid === 'number' ? paid : Number(paid)
  return Number.isFinite(n) && n + 0.01 >= expected
}
