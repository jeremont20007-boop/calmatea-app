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

  const pathname = request.nextUrl.pathname
  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/publicitario',
    '/auth/callback',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
    '/sw.js',
  ]
  // Los webhooks los llaman Stripe / Mercado Pago / PayWay sin sesión: cada uno
  // valida su propia firma o token, así que no deben redirigirse al login.
  const publicPrefixes = [
    '/api/stripe/webhook',
    '/api/mercadopago/webhook',
    '/api/payway/webhook',
    '/api/ads/webhook',
  ]
  const isPublic =
    publicPaths.includes(pathname) ||
    publicPrefixes.some(p => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/workbox-')

  if (!user && pathname.startsWith('/api/') && !isPublic) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/auth/login' || pathname === '/auth/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
