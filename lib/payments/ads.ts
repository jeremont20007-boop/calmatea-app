import { AD_DURATION_OPTIONS, calcAdPrice } from '@/types'

/**
 * Precio de un anuncio en pesos según su duración, o null si la duración no
 * es una de las opciones permitidas. Debe coincidir con public.ad_price_for()
 * en supabase/migrations/20261102_protect_ad_prices.sql (lo verifica un test).
 */
export function getAdPriceARS(durationDays: number | null | undefined): number | null {
  if (!AD_DURATION_OPTIONS.some(o => o.days === durationDays)) return null
  return calcAdPrice(durationDays as number)
}
