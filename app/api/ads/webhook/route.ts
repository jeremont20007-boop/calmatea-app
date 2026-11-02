import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidMpPaymentId } from '@/lib/payments'
import { AD_DURATION_OPTIONS, calcAdPrice } from '@/types'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  // Never trust the body: always re-fetch the payment from MercadoPago.
  const paymentId = body.data?.id ?? body.id
  if (!isValidMpPaymentId(paymentId)) return NextResponse.json({ ok: true })

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 })

  const payment = await res.json()
  if (payment.status !== 'approved') return NextResponse.json({ ok: true })

  const adId = payment.metadata?.ad_id
  if (typeof adId !== 'string' || !adId) return NextResponse.json({ ok: true })

  // Service role client: the webhook has no logged-in user, so with the normal
  // client RLS silently blocked this update and ads were never marked as paid.
  const supabase = createAdminClient()

  const { data: ad } = await supabase
    .from('ads')
    .select('duration_days, payment_status')
    .eq('id', adId)
    .single()

  if (!ad || ad.payment_status === 'paid') return NextResponse.json({ ok: true })

  const durationDays = AD_DURATION_OPTIONS.some(o => o.days === ad.duration_days)
    ? (ad.duration_days as number)
    : 30
  const expected = calcAdPrice(durationDays)
  if (payment.currency_id !== 'ARS' || Number(payment.transaction_amount) < expected) {
    console.error('MercadoPago ad payment amount mismatch', { paymentId, adId })
    return NextResponse.json({ ok: true })
  }

  const now = new Date()
  const endsAt = new Date(now)
  endsAt.setDate(endsAt.getDate() + durationDays)

  await supabase
    .from('ads')
    .update({
      payment_status: 'paid',
      status: 'pending_review',
      total_price: expected,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .eq('id', adId)

  return NextResponse.json({ ok: true })
}
