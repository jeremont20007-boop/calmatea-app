// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeSupabase, post } from './fakeSupabase'

let fake: ReturnType<typeof createFakeSupabase>
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => fake.client }))

import { POST } from '@/app/api/payway/webhook/route'
import { buildPaywayNotificationUrl, signPaywayProfile, verifyPaywaySignature } from '@/lib/payments/payway'

const APP = 'http://localhost:3000'

describe('Firma de la URL de aviso de PayWay', () => {
  beforeEach(() => vi.stubEnv('PAYWAY_WEBHOOK_SECRET', 'secreto-de-prueba-1234567890'))
  afterEach(() => vi.unstubAllEnvs())

  it('una firma generada por nosotros es válida', () => {
    expect(verifyPaywaySignature('perfil-1', signPaywayProfile('perfil-1'))).toBe(true)
  })

  it('la firma de un perfil no sirve para otro', () => {
    expect(verifyPaywaySignature('perfil-2', signPaywayProfile('perfil-1'))).toBe(false)
  })

  it('rechaza firmas inventadas o mal formadas', () => {
    expect(verifyPaywaySignature('perfil-1', 'abc')).toBe(false)
    expect(verifyPaywaySignature('perfil-1', 'no-es-hex')).toBe(false)
    expect(verifyPaywaySignature('perfil-1', '0'.repeat(64))).toBe(false)
  })

  it('si no hay secreto configurado, rechaza todo', () => {
    const sig = signPaywayProfile('perfil-1')
    vi.stubEnv('PAYWAY_WEBHOOK_SECRET', '')
    expect(verifyPaywaySignature('perfil-1', sig)).toBe(false)
    expect(() => signPaywayProfile('perfil-1')).toThrow()
  })

  it('arma la URL de aviso con perfil y firma', () => {
    const url = new URL(buildPaywayNotificationUrl(APP, 'perfil-1'))
    expect(url.pathname).toBe('/api/payway/webhook')
    expect(url.searchParams.get('profile')).toBe('perfil-1')
    expect(url.searchParams.get('sig')).toBe(signPaywayProfile('perfil-1'))
  })
})

describe('Webhook de PayWay (premium)', () => {
  beforeEach(() => {
    vi.stubEnv('PAYWAY_WEBHOOK_SECRET', 'secreto-de-prueba-1234567890')
    fake = createFakeSupabase({ profiles: [{ id: 'perfil-1', role: 'conductor', plan: 'free' }] })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  const signedUrl = (profileId = 'perfil-1') => buildPaywayNotificationUrl(APP, profileId)

  it('activa premium con un aviso firmado y aprobado', async () => {
    const res = await POST(post(signedUrl(), { status: 'approved', metadata: { profile_id: 'perfil-1' } }))
    expect(res.status).toBe(200)
    expect(fake.updates).toEqual([
      { table: 'profiles', values: { plan: 'premium', subscription_status: 'active' }, column: 'id', value: 'perfil-1' },
    ])
  })

  it('RECHAZA un aviso falso sin firma (nadie puede regalarse premium)', async () => {
    const res = await POST(post(`${APP}/api/payway/webhook`, { status: 'approved', metadata: { profile_id: 'perfil-1' } }))
    expect(res.status).toBe(401)
    expect(fake.updates).toHaveLength(0)
  })

  it('rechaza un aviso con la firma de otro perfil', async () => {
    const forged = new URL(signedUrl('perfil-1'))
    forged.searchParams.set('profile', 'perfil-2')
    const res = await POST(post(forged.toString(), { status: 'approved' }))
    expect(res.status).toBe(401)
    expect(fake.updates).toHaveLength(0)
  })

  it('rechaza si el perfil del aviso no coincide con el firmado', async () => {
    const res = await POST(post(signedUrl(), { status: 'approved', metadata: { profile_id: 'perfil-2' } }))
    expect(res.status).toBe(400)
    expect(fake.updates).toHaveLength(0)
  })

  it('no activa nada si el pago no está aprobado', async () => {
    const res = await POST(post(signedUrl(), { status: 'rejected' }))
    expect(res.status).toBe(200)
    expect(fake.updates).toHaveLength(0)
  })

  it('responde error (para que PayWay reintente) si falla la base de datos', async () => {
    fake.failUpdates()
    const res = await POST(post(signedUrl(), { status: 'approved' }))
    expect(res.status).toBe(500)
  })
})
