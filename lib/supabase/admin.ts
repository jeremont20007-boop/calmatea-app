import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client that uses the service_role key and BYPASSES RLS.
// Only import this from route handlers / server code that has already verified
// the caller (e.g. a signed payment webhook). Never import it from a
// 'use client' component: the key must never reach the browser.
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient must only be used on the server')
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase service role credentials are not configured')
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
