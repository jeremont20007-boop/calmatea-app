import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPaywaySignature } from '@/lib/payments/payway'
import { activatePremium } from '@/lib/payments/premium'

// Aviso de PayWay cuando cambia el estado de un pago de suscripción premium.
// La URL viene firmada por nosotros (ver lib/payments/payway.ts): sin una firma
// válida el aviso se rechaza, porque cualquiera podría mandar uno falso.
export async function POST(request: Request) {
  const url = new URL(request.url)
  const profileId = url.searchParams.get('profile')
  const signature = url.searchParams.get('sig')

  if (!profileId || !signature || !verifyPaywaySignature(profileId, signature)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  if (body.status !== 'approved') return NextResponse.json({ ok: true })

  // Si el aviso trae un perfil, tiene que ser el mismo que firmamos.
  const bodyProfileId = body.metadata?.profile_id
  if (bodyProfileId && bodyProfileId !== profileId) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const supabase = createAdminClient()
  const error = await activatePremium(supabase, profileId)
  if (error) {
    console.error('[payway/webhook] no se pudo activar premium', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
