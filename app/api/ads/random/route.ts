import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Cada pedido elige un anuncio distinto y cuenta una impresión: nunca cachear.
export const dynamic = 'force-dynamic'

interface ServedAd {
  id: string
  title: string
  description: string | null
  mobile_image_url: string | null
  desktop_image_url: string | null
  target_url: string
  cta_text: string
  advertiser_name: string | null
}

export async function GET() {
  // La función de la base elige el anuncio y suma la impresión en un solo paso
  // (ver supabase/migrations/20261102_ad_impressions.sql).
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('serve_random_ad')

  if (error) {
    console.error('[ads/random] no se pudo obtener un anuncio', error)
    return NextResponse.json({ ad: null })
  }

  const ad = (data as ServedAd[] | null)?.[0]
  if (!ad) return NextResponse.json({ ad: null })

  return NextResponse.json(
    {
      ad: {
        id: ad.id,
        title: ad.title,
        description: ad.description ?? undefined,
        mobile_image_url: ad.mobile_image_url ?? undefined,
        desktop_image_url: ad.desktop_image_url ?? undefined,
        target_url: ad.target_url,
        cta_text: ad.cta_text,
        advertiser_name: ad.advertiser_name ?? undefined,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
