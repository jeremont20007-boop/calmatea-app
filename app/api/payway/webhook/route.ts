import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeEqual } from '@/lib/payments'

export async function POST(request: Request) {
  // Solo aceptamos notificaciones que traen el token secreto que incluimos en
  // notification_url al crear la sesión de pago. Sin esto, cualquiera podría
  // marcar una cuenta como premium enviando un POST a mano.
  const token = new URL(request.url).searchParams.get('token')
  if (!safeEqual(token, process.env.PAYWAY_WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  // PayWay sends payment status notifications
  if (body.status !== 'approved') return NextResponse.json({ ok: true })

  const profileId = body.metadata?.profile_id
  if (!profileId || typeof profileId !== 'string') return NextResponse.json({ ok: true })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ plan: 'premium', subscription_status: 'active' })
    .eq('id', profileId)

  if (error) {
    console.error('PayWay webhook: error actualizando perfil', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
