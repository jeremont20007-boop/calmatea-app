import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdPriceARS } from '@/lib/payments/ads'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { adId } = await request.json().catch(() => ({}))
  if (!adId) return NextResponse.json({ error: 'Missing adId' }, { status: 400 })

  const { data: ad } = await supabase
    .from('ads')
    .select('id, title, total_price, payment_status, duration_days, advertiser:advertisers(user_id)')
    .eq('id', adId)
    .single()

  if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })

  const advertiser = ad.advertiser as unknown as { user_id: string }
  if (advertiser.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (ad.payment_status === 'paid') {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 })
  }
  // El precio se calcula en el servidor según la duración, nunca se toma del anuncio.
  const priceARS = getAdPriceARS(ad.duration_days)
  if (priceARS === null) {
    return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: `Publicidad VehiLink — ${ad.title}`,
          description: `Campaña publicitaria · ${ad.duration_days} días`,
          quantity: 1,
          unit_price: priceARS,
          currency_id: 'ARS',
        },
      ],
      back_urls: {
        success: `${appUrl}/anuncios/${adId}?paid=1`,
        failure: `${appUrl}/anuncios/${adId}?error=1`,
        pending: `${appUrl}/anuncios/${adId}?pending=1`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/ads/webhook`,
      metadata: { ad_id: adId },
    }),
  })

  if (!res.ok) return NextResponse.json({ error: 'MercadoPago error' }, { status: 500 })

  const pref = await res.json()
  return NextResponse.json({ url: pref.init_point })
}
