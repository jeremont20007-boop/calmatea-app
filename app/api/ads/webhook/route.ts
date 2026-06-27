import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false })

  const paymentId = body.data?.id ?? body.id
  if (!paymentId) return NextResponse.json({ ok: true })

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  if (!res.ok) return NextResponse.json({ ok: false })

  const payment = await res.json()
  if (payment.status !== 'approved') return NextResponse.json({ ok: true })

  const adId = payment.metadata?.ad_id
  if (!adId) return NextResponse.json({ ok: true })

  const supabase = await createClient()

  const { data: ad } = await supabase
    .from('ads')
    .select('duration_days')
    .eq('id', adId)
    .single()

  if (!ad) return NextResponse.json({ ok: true })

  const now = new Date()
  const endsAt = new Date(now)
  endsAt.setDate(endsAt.getDate() + (ad.duration_days ?? 30))

  await supabase
    .from('ads')
    .update({
      payment_status: 'paid',
      status: 'pending_review',
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .eq('id', adId)

  return NextResponse.json({ ok: true })
}
