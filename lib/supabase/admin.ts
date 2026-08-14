import { createClient } from '@supabase/supabase-js'

/**
 * Cliente con service role. Saltea RLS, así que sólo puede usarse dentro de
 * route handlers o server components — nunca en código que llegue al browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
