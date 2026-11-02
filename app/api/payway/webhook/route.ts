import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyLegacyPaywayToken, verifyPaywaySignature } from '@/lib/payments/payway'
import { activatePremium } from '@/lib/payments/premium'

// Aviso de PayWay cuando cambia el estado de un pago de suscripción premium.
// La URL viene firmada por nosotros (ver lib/payments/payway.ts): sin una firma
// válida el aviso se rechaza, porque cualquiera podría mandar uno falso.
export async function POST(request: Request) {
  const url = new URL(request.url)
  const signedProfileId = url.searchParams.get('profile')
  const signature = url.searchParams.get('sig')
  const legacyToken = url.searchParams.get('token')

  const signed = !!signedProfileId && !!signature && verifyPaywaySignature(signedProfileId, signature)
  const legacy = !signed && !!legacyToken && verifyLegacyPaywayToken(legacyToken)
  if (!signed && !legacy) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  if (body.status !== 'approved') return NextResponse.json({ ok: true })

  const bodyProfileId = body.metadata?.profile_id
  let profileId: string
  if (signed) {
    // Si el aviso trae un perfil, tiene que ser el mismo que firmamos.
    if (bodyProfileId && bodyProfileId !== signedProfileId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    profileId = signedProfileId!
  } else {
    // Formato anterior: el perfil viene en el aviso (que ya probó conocer el secreto).
    if (typeof bodyProfileId !== 'string' || !bodyProfileId) return NextResponse.json({ ok: true })
    profileId = bodyProfileId
  }

  const supabase = createAdminClient()
  const error = await activatePremium(supabase, profileId)
  if (error) {
    console.error('[payway/webhook] no se pudo activar premium', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
