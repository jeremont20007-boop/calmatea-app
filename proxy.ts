import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Static/public files don't need a session check. Skipping them avoids a
    // Supabase round-trip per file and stops anonymous visitors from being
    // redirected to /auth/login when the browser asks for the PWA manifest,
    // the service worker, robots.txt or sitemap.xml.
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|ogg)$).*)',
  ],
}
