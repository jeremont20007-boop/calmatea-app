import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Routes reachable without a session. Everything else requires login.
  //  - /auth/*: login, registro, registro de publicitarios, callback de OAuth, logout
  //  - /api/*: each API route checks the session itself and answers 401 (a
  //    redirect would break payment webhooks, which never carry a session)
  //  - SEO / PWA files that browsers and crawlers fetch anonymously
  const publicExact = ['/', '/robots.txt', '/sitemap.xml', '/manifest.json', '/sw.js']
  const publicPrefixes = ['/auth/', '/api/']
  const isPublic =
    publicExact.includes(pathname) ||
    publicPrefixes.some(prefix => pathname.startsWith(prefix))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/auth/login' || pathname === '/auth/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
