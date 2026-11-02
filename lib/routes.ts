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
  // API: cada ruta verifica la sesión por su cuenta y responde 401. Redirigir
  // rompería los webhooks de pagos, que nunca traen sesión de usuario.
  '/api/',
]

/** Rutas de las que un usuario ya logueado es redirigido al dashboard. */
export const AUTH_ONLY_PATHS = ['/auth/login', '/auth/register']

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))
}
