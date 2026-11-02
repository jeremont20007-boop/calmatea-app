import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchMercadoPagoPayment, getPaymentIdFromNotification } from '@/lib/payments/mercadopago'

// Aviso de MercadoPago cuando cambia el estado del pago de un anuncio.
export async function POST(request: Request) {
  const url = new URL(request.url)
  const body = await request.json().catch(() => null)

  const paymentId = getPaymentIdFromNotification(url, body)
  if (!paymentId) return NextResponse.json({ ok: true })

  // No confiamos en el contenido del aviso: consultamos el pago real a MercadoPago.
  const payment = await fetchMercadoPagoPayment(paymentId)
  if (!payment) return NextResponse.json({ ok: false }, { status: 502 })
  if (payment.status !== 'approved') return NextResponse.json({ ok: true })

  const adId = payment.metadata?.ad_id
  if (typeof adId !== 'string' || !adId) return NextResponse.json({ ok: true })

  const supabase = createAdminClient()

  const { data: ad } = await supabase
    .from('ads')
    .select('duration_days, total_price, payment_status')
    .eq('id', adId)
    .single()

  if (!ad) return NextResponse.json({ ok: true })
  // Avisos repetidos: no volver a reiniciar las fechas de un anuncio ya pago.
  if (ad.payment_status === 'paid') return NextResponse.json({ ok: true })

  if (payment.currency_id !== 'ARS' || Number(payment.transaction_amount) < Number(ad.total_price)) {
    console.error('[ads/webhook] monto o moneda no coinciden con el anuncio', {
      paymentId,
      adId,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      expected: ad.total_price,
    })
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
    console.error('[ads/webhook] no se pudo marcar el anuncio como pago', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
