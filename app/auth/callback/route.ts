import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role')
  const isNew = searchParams.get('new') === '1'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // For new Google sign-ups with an explicit role, update the profile role.
    // We check created_at < 30s to avoid changing the role of returning users
    // who might hit this URL with stale params.
    if (isNew && (role === 'conductor' || role === 'propietario')) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          const ageSeconds = (Date.now() - new Date(profile.created_at).getTime()) / 1000
          if (ageSeconds < 30) {
            await supabase
              .from('profiles')
              .update({ role })
              .eq('user_id', user.id)
          }
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
