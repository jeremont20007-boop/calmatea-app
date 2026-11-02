import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPremiumPriceARS } from '@/lib/payments/premium'
import { buildPaywayNotificationUrl, isPaywayWebhookConfigured } from '@/lib/payments/payway'

// PayWay (Prisma) — Argentina payment gateway
// Docs: https://developers.payway.com.ar
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, plan')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (profile.plan === 'premium') return NextResponse.json({ error: 'Already premium' }, { status: 400 })

  const priceARS = getPremiumPriceARS(profile.role)
  if (priceARS === null) return NextResponse.json({ error: 'Plan not available' }, { status: 400 })

  // Sin el secreto no podríamos verificar el aviso de pago: mejor no cobrar.
  if (!isPaywayWebhookConfigured()) {
    console.error('[payway/checkout] falta PAYWAY_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'PayWay not configured' }, { status: 503 })
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // PayWay Hosted Checkout session creation
  const res = await fetch('https://api.payway.com.ar/api/v1/payment_sessions', {
    method: 'POST',
    headers: {
      'apikey': process.env.PAYWAY_API_KEY ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      site: { id: process.env.PAYWAY_SITE_ID ?? '', template_id: process.env.PAYWAY_TEMPLATE_ID ?? '' },
      customer: { id: profile.id, email: user.email },
      payment: {
        amount: priceARS * 100, // centavos
        currency: 'ARS',
        description: `VehiLink Premium — ${profile.role}`,
      },
      back_urls: {
        success: `${appUrl}/subscription?success=pw`,
        cancel: `${appUrl}/subscription`,
        pending: `${appUrl}/subscription?pending=pw`,
      },
      notification_url: buildPaywayNotificationUrl(appUrl, profile.id),
      metadata: { profile_id: profile.id },
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'PayWay error' }, { status: 500 })
  }

  const session = await res.json()
  return NextResponse.json({ url: session.url ?? session.redirect_url })
}
