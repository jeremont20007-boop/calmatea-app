import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Simulamos el cliente de Supabase: nunca se hace una llamada real.
const getUser = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser } }),
}))

import { updateSession } from '@/lib/supabase/middleware'

function request(path: string, method = 'GET') {
  return new NextRequest(new URL(path, 'http://localhost:3000'), { method })
}

function redirectTarget(res: Response) {
  const location = res.headers.get('location')
  return location ? new URL(location).pathname : null
}

describe('updateSession (middleware de sesión)', () => {
  beforeEach(() => {
    getUser.mockReset()
  })

  describe('sin sesión iniciada', () => {
    beforeEach(() => {
      getUser.mockResolvedValue({ data: { user: null } })
    })

    it('redirige al login desde una página protegida', async () => {
      const res = await updateSession(request('/dashboard'))
      expect(res.status).toBe(307)
      expect(redirectTarget(res)).toBe('/auth/login')
    })

    it.each(['/', '/auth/login', '/auth/register', '/auth/publicitario', '/auth/callback?code=abc'])(
      'deja pasar la página pública %s',
      async path => {
        const res = await updateSession(request(path))
        expect(res.headers.get('location')).toBeNull()
      }
    )

    it.each([
      '/api/stripe/webhook',
      '/api/mercadopago/webhook',
      '/api/payway/webhook',
      '/api/ads/webhook',
    ])('no redirige el webhook de pagos %s', async path => {
      const res = await updateSession(request(path, 'POST'))
      expect(res.headers.get('location')).toBeNull()
    })
  })

  describe('con sesión iniciada', () => {
    beforeEach(() => {
      getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    })

    it.each(['/auth/login', '/auth/register'])('redirige %s al dashboard', async path => {
      const res = await updateSession(request(path))
      expect(redirectTarget(res)).toBe('/dashboard')
    })

    it('deja entrar a páginas protegidas', async () => {
      const res = await updateSession(request('/dashboard'))
      expect(res.headers.get('location')).toBeNull()
    })
  })
})
