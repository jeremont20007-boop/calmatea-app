import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase con la service role key. Ignora RLS.
 * SOLO para código de servidor (route handlers / webhooks). Nunca importarlo
 * desde un componente 'use client'.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient() solo puede usarse en el servidor')
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
