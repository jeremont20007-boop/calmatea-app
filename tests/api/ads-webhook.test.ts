// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeSupabase, mockMercadoPagoPayment, post } from './fakeSupabase'

let fake: ReturnType<typeof createFakeSupabase>
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => fake.client }))

import { POST } from '@/app/api/ads/webhook/route'

const URL_ = 'http://localhost:3000/api/ads/webhook'
const payment = (extra: Record<string, unknown> = {}) => ({
  id: 55,
  status: 'approved',
  transaction_amount: 3500, // 7 días = $3.500
  currency_id: 'ARS',
  metadata: { ad_id: 'anuncio-1' },
  ...extra,
})

describe('Webhook de MercadoPago (anuncios)', () => {
  beforeEach(() => {
    fake = createFakeSupabase({
      ads: [{ id: 'anuncio-1', duration_days: 7, total_price: 3500, payment_status: 'pending' }],
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('marca el anuncio como pago y lo manda a revisión por 7 días', async () => {
    mockMercadoPagoPayment(payment())
    const res = await POST(post(URL_, { type: 'payment', data: { id: '55' } }))
    expect(res.status).toBe(200)
    expect(fake.updates).toHaveLength(1)
    const { values } = fake.updates[0]
    expect(values).toMatchObject({ payment_status: 'paid', status: 'pending_review' })
    const days = (Date.parse(values.ends_at as string) - Date.parse(values.starts_at as string)) / 86_400_000
    expect(Math.round(days)).toBe(7)
  })

  it('no lo activa si se pagó menos que el precio del anuncio', async () => {
    mockMercadoPagoPayment(payment({ transaction_amount: 100 }))
    await POST(post(URL_, { type: 'payment', data: { id: '55' } }))
    expect(fake.updates).toHaveLength(0)
  })

  it('un aviso repetido no reinicia las fechas de un anuncio ya pago', async () => {
    fake = createFakeSupabase({
      ads: [{ id: 'anuncio-1', duration_days: 7, total_price: 3500, payment_status: 'paid' }],
    })
    mockMercadoPagoPayment(payment())
    await POST(post(URL_, { type: 'payment', data: { id: '55' } }))
    expect(fake.updates).toHaveLength(0)
  })

  it('compara contra el precio real de la duración, no contra el precio guardado', async () => {
    // Aunque el anuncio diga total_price = 1, para 7 días hay que pagar $3.500
    fake = createFakeSupabase({
      ads: [{ id: 'anuncio-1', duration_days: 7, total_price: 1, payment_status: 'pending' }],
    })
    mockMercadoPagoPayment(payment({ transaction_amount: 1 }))
    await POST(post(URL_, { type: 'payment', data: { id: '55' } }))
    expect(fake.updates).toHaveLength(0)
  })

  it('no hace nada si el pago no está aprobado', async () => {
    mockMercadoPagoPayment(payment({ status: 'in_process' }))
    await POST(post(URL_, { type: 'payment', data: { id: '55' } }))
    expect(fake.updates).toHaveLength(0)
  })
})
