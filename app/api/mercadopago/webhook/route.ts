import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidMpPaymentId, premiumPriceFor } from '@/lib/payments'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  // MercadoPago sends topic=payment&id=XXX. We never trust the body: we always
  // re-fetch the payment from MercadoPago with our own access token.
  const paymentId = body.data?.id ?? body.id
  if (!isValidMpPaymentId(paymentId)) return NextResponse.json({ ok: true })

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })

  if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 })

  const payment = await res.json()
  if (payment.status !== 'approved') return NextResponse.json({ ok: true })

  const profileId = payment.metadata?.profile_id
  if (typeof profileId !== 'string' || !profileId) return NextResponse.json({ ok: true })

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', profileId)
    .single()
  if (!profile) return NextResponse.json({ ok: true })

  // Make sure the amount actually paid matches the real price.
  const expected = premiumPriceFor(profile.role)
  if (payment.currency_id !== 'ARS' || Number(payment.transaction_amount) < expected) {
    console.error('MercadoPago premium payment amount mismatch', { paymentId, profileId })
    return NextResponse.json({ ok: true })
  }

  await supabase
    .from('profiles')
    .update({ plan: 'premium', subscription_status: 'active' })
    .eq('id', profileId)

  return NextResponse.json({ ok: true })
}
