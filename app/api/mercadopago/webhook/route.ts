import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchMercadoPagoPayment, getPaymentIdFromNotification } from '@/lib/payments/mercadopago'
import { activatePremium, getPremiumPriceARS } from '@/lib/payments/premium'

// Aviso de MercadoPago cuando cambia el estado de un pago de suscripción premium.
// Respondemos 200 a todo lo que no hay que procesar; un error 5xx hace que
// MercadoPago reintente más tarde.
export async function POST(request: Request) {
  const url = new URL(request.url)
  const body = await request.json().catch(() => null)

  const paymentId = getPaymentIdFromNotification(url, body)
  if (!paymentId) return NextResponse.json({ ok: true })

  // No confiamos en el contenido del aviso: consultamos el pago real a MercadoPago.
  const payment = await fetchMercadoPagoPayment(paymentId)
  if (!payment) return NextResponse.json({ ok: false }, { status: 502 })
  if (payment.status !== 'approved') return NextResponse.json({ ok: true })

  const profileId = payment.metadata?.profile_id
  if (typeof profileId !== 'string' || !profileId) return NextResponse.json({ ok: true })

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, plan')
    .eq('id', profileId)
    .single()

  if (!profile) return NextResponse.json({ ok: true })
  if (profile.plan === 'premium') return NextResponse.json({ ok: true })

  const expected = getPremiumPriceARS(profile.role)
  if (expected === null || payment.currency_id !== 'ARS' || Number(payment.transaction_amount) < expected) {
    console.error('[mercadopago/webhook] monto o moneda no coinciden con el plan', {
      paymentId,
      profileId,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      expected,
    })
    return NextResponse.json({ ok: true })
  }

  const error = await activatePremium(supabase, profileId)
  if (error) {
    console.error('[mercadopago/webhook] no se pudo activar premium', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
