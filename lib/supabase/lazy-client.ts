import type { SupabaseClient } from '@supabase/supabase-js'

let clientPromise: Promise<SupabaseClient> | null = null

/**
 * Loads the Supabase browser client on demand.
 *
 * The Supabase SDK is large (~60 kB gzipped). Importing it statically puts it
 * in the initial JS of every page that has a form or action button, even
 * though it is only needed once the user submits something. Loading it lazily
 * keeps the first load small, which matters most on mobile connections.
 */
export function getBrowserClient(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('./client').then(m => m.createClient())
  }
  return clientPromise
}
