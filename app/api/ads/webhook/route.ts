import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { amountCovers } from '@/lib/payments'
import { calcAdPrice } from '@/types'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  const paymentId = body.data?.id ?? body.id
  if (!paymentId || !/^\d+$/.test(String(paymentId))) return NextResponse.json({ ok: true })

  // Nunca confiamos en el cuerpo del webhook: consultamos el pago a la API de MP.
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 })

  const payment = await res.json()
  if (payment.status !== 'approved') return NextResponse.json({ ok: true })

  const adId = payment.metadata?.ad_id
  if (!adId || typeof adId !== 'string') return NextResponse.json({ ok: true })

  const supabase = createAdminClient()

  const { data: ad } = await supabase
    .from('ads')
    .select('duration_days, payment_status')
    .eq('id', adId)
    .single()

  if (!ad || ad.payment_status === 'paid') return NextResponse.json({ ok: true })

  // El monto cobrado tiene que coincidir con el precio calculado en el servidor
  // a partir de la duración (no con total_price, que viene del navegador).
  const expected = calcAdPrice(ad.duration_days ?? 30)
  if (!amountCovers(payment.transaction_amount, expected, payment.currency_id)) {
    console.error('Ads webhook: monto insuficiente', { paymentId, adId })
    return NextResponse.json({ ok: true })
  }

  const now = new Date()
  const endsAt = new Date(now)
  endsAt.setDate(endsAt.getDate() + (ad.duration_days ?? 30))

  const { error } = await supabase
    .from('ads')
    .update({
      payment_status: 'paid',
      status: 'pending_review',
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .eq('id', adId)

  if (error) {
    console.error('Ads webhook: error actualizando anuncio', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
