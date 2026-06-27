import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => ({}))
  const priceARS = body.price ?? (profile.role === 'conductor' ? 2990 : 3990)
  const title = `VehiLink Premium — ${profile.role === 'conductor' ? 'Conductor' : 'Propietario'}`

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{ title, quantity: 1, unit_price: priceARS, currency_id: 'ARS' }],
      payer: { email: user.email },
      back_urls: {
        success: `${appUrl}/subscription?success=mp`,
        failure: `${appUrl}/subscription?error=mp`,
        pending: `${appUrl}/subscription?pending=mp`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      metadata: { profile_id: profile.id, role: profile.role },
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'MercadoPago error' }, { status: 500 })
  }

  const preference = await res.json()
  return NextResponse.json({ url: preference.init_point })
}
