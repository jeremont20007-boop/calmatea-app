import { describe, expect, it } from 'vitest'
import { AUTH_ONLY_PATHS, isPublicPath } from '@/lib/routes'

describe('isPublicPath', () => {
  it.each([
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/publicitario',
    '/auth/callback',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
    '/sw.js',
    '/api/stripe/webhook',
    '/api/mercadopago/webhook',
    '/api/payway/webhook',
    '/api/ads/webhook',
    // Las rutas de API que necesitan sesión la verifican ellas mismas (401)
    '/api/stripe/checkout',
    '/api/ads/random',
  ])('%s no redirige al login', path => {
    expect(isPublicPath(path)).toBe(true)
  })

  it.each([
    '/dashboard',
    '/perfil',
    '/vehiculos',
    '/vehiculos/nuevo',
    '/solicitudes',
    '/subscription',
    '/ad-dashboard',
    '/anuncios',
    '/usuarios',
    '/authx',
    '/apix',
  ])('%s requiere sesión', path => {
    expect(isPublicPath(path)).toBe(false)
  })
})

describe('AUTH_ONLY_PATHS', () => {
  it('incluye login y registro', () => {
    expect(AUTH_ONLY_PATHS).toEqual(['/auth/login', '/auth/register'])
  })
})
