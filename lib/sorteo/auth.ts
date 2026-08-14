import { createClient } from '@/lib/supabase/server'

/** `true` sólo si hay sesión activa y el perfil tiene rol admin. */
export async function esAdmin() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  return profile?.role === 'admin'
}
