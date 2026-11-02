import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

function tokenMatches(received: string | null, expected: string): boolean {
  if (!received) return false
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// PayWay payment notifications.
// SECURITY: previously anyone could POST {"status":"approved","metadata":{"profile_id":...}}
// to this URL and get Premium for free. Now the request must carry the secret
// token we put in notification_url (PAYWAY_WEBHOOK_SECRET). If the secret is not
// configured, the webhook is disabled.
// TODO (owner): when possible, also confirm the payment against the PayWay API
// or validate PayWay's signature, following their official docs.
export async function POST(request: Request) {
  const secret = process.env.PAYWAY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const token = new URL(request.url).searchParams.get('token')
  if (!tokenMatches(token, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  if (body.status !== 'approved') return NextResponse.json({ ok: true })

  const profileId = body.metadata?.profile_id
  if (typeof profileId !== 'string' || !profileId) return NextResponse.json({ ok: true })

  await createAdminClient()
    .from('profiles')
    .update({ plan: 'premium', subscription_status: 'active' })
    .eq('id', profileId)

  return NextResponse.json({ ok: true })
}
