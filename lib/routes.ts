/**
 * Rutas que se pueden visitar sin haber iniciado sesión.
 *
 * Se usa en el middleware (proxy.ts) para decidir si redirigir al login.
 */

// Coincidencia exacta
const PUBLIC_EXACT = new Set<string>([
  '/',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/sw.js',
])

// Coincidencia por prefijo
const PUBLIC_PREFIXES = [
  // login, registro, registro de publicitarios y callback de OAuth/confirmación de email
  '/auth/',
  // Webhooks de pagos: los llaman Stripe/MercadoPago/PayWay sin sesión de usuario
  '/api/stripe/webhook',
  '/api/mercadopago/webhook',
  '/api/payway/webhook',
  '/api/ads/webhook',
]

/** Rutas de las que un usuario ya logueado es redirigido al dashboard. */
export const AUTH_ONLY_PATHS = ['/auth/login', '/auth/register']

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return PUBLIC_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)
  )
}
