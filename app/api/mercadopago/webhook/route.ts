import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { amountCovers, premiumPriceFor } from '@/lib/payments'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  // MercadoPago sends topic=payment&id=XXX
  const paymentId = body.data?.id ?? body.id
  if (!paymentId || !/^\d+$/.test(String(paymentId))) return NextResponse.json({ ok: true })

  // Nunca confiamos en el cuerpo del webhook: consultamos el pago a la API de MP.
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })

  if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 })

  const payment = await res.json()
  if (payment.status !== 'approved') return NextResponse.json({ ok: true })

  const profileId = payment.metadata?.profile_id
  if (!profileId || typeof profileId !== 'string') return NextResponse.json({ ok: true })

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', profileId)
    .single()

  if (!profile) return NextResponse.json({ ok: true })

  // El monto cobrado tiene que coincidir con el precio del plan.
  if (!amountCovers(payment.transaction_amount, premiumPriceFor(profile.role), payment.currency_id)) {
    console.error('MP webhook: monto insuficiente para premium', { paymentId, profileId })
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ plan: 'premium', subscription_status: 'active' })
    .eq('id', profileId)

  if (error) {
    console.error('MP webhook: error actualizando perfil', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
