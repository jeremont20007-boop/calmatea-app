import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false })

  // MercadoPago sends topic=payment&id=XXX
  const paymentId = body.data?.id ?? body.id
  if (!paymentId) return NextResponse.json({ ok: true })

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })

  if (!res.ok) return NextResponse.json({ ok: false })

  const payment = await res.json()
  if (payment.status !== 'approved') return NextResponse.json({ ok: true })

  const profileId = payment.metadata?.profile_id
  if (!profileId) return NextResponse.json({ ok: true })

  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ plan: 'premium', subscription_status: 'active' })
    .eq('id', profileId)

  return NextResponse.json({ ok: true })
}
