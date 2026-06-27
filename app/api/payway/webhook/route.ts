import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false })

  // PayWay sends payment status notifications
  if (body.status !== 'approved') return NextResponse.json({ ok: true })

  const profileId = body.metadata?.profile_id
  if (!profileId) return NextResponse.json({ ok: true })

  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ plan: 'premium', subscription_status: 'active' })
    .eq('id', profileId)

  return NextResponse.json({ ok: true })
}
