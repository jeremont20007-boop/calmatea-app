import { createAdminClient } from '@/lib/supabase/admin'

export interface PublicAd {
  id: string
  title: string
  description?: string
  mobile_image_url?: string
  desktop_image_url?: string
  target_url: string
  cta_text: string
  advertiser_name?: string
}

interface ServedAdRow {
  id: string
  title: string
  description: string | null
  mobile_image_url: string | null
  desktop_image_url: string | null
  target_url: string
  cta_text: string
  advertiser_name: string | null
}

/**
 * Elige un anuncio activo al azar y le cuenta una impresión.
 * Lo usan /api/ads/random y las páginas del servidor que muestran el banner
 * directamente (para que no "aparezca de golpe" después de cargar).
 *
 * Todo lo hace la función de la base serve_random_ad() en un solo paso atómico
 * (ver supabase/migrations/20261102_ad_impressions.sql): así no se pierden
 * impresiones con visitas simultáneas. Sólo la puede llamar el servidor.
 */
export async function pickRandomAd(): Promise<PublicAd | null> {
  const { data, error } = await createAdminClient().rpc('serve_random_ad')

  if (error) {
    console.error('[ads] no se pudo obtener un anuncio', error)
    return null
  }

  const ad = (data as ServedAdRow[] | null)?.[0]
  if (!ad) return null

  return {
    id: ad.id,
    title: ad.title,
    description: ad.description ?? undefined,
    mobile_image_url: ad.mobile_image_url ?? undefined,
    desktop_image_url: ad.desktop_image_url ?? undefined,
    target_url: ad.target_url,
    cta_text: ad.cta_text,
    advertiser_name: ad.advertiser_name ?? undefined,
  }
}
