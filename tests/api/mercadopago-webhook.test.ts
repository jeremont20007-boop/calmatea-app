// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeSupabase, mockMercadoPagoPayment, post } from './fakeSupabase'

let fake: ReturnType<typeof createFakeSupabase>
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => fake.client }))

import { POST } from '@/app/api/mercadopago/webhook/route'

const URL_ = 'http://localhost:3000/api/mercadopago/webhook'
const approved = (extra: Record<string, unknown> = {}) => ({
  id: 123,
  status: 'approved',
  transaction_amount: 2990,
  currency_id: 'ARS',
  metadata: { profile_id: 'perfil-1' },
  ...extra,
})

describe('Webhook de MercadoPago (premium)', () => {
  beforeEach(() => {
    fake = createFakeSupabase({
      profiles: [
        { id: 'perfil-1', role: 'conductor', plan: 'free' },
        { id: 'perfil-2', role: 'propietario', plan: 'free' },
      ],
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('activa premium cuando el pago está aprobado y el monto es correcto', async () => {
    const fetchMock = mockMercadoPagoPayment(approved())
    const res = await POST(post(URL_, { type: 'payment', data: { id: '123' } }))

    expect(res.status).toBe(200)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.mercadopago.com/v1/payments/123')
    expect(fake.updates).toEqual([
      { table: 'profiles', values: { plan: 'premium', subscription_status: 'active' }, column: 'id', value: 'perfil-1' },
    ])
  })

  it('también acepta el formato viejo (IPN) por query string', async () => {
    mockMercadoPagoPayment(approved())
    const res = await POST(post(`${URL_}?topic=payment&id=123`))
    expect(res.status).toBe(200)
    expect(fake.updates).toHaveLength(1)
  })

  it('no activa nada si el pago no está aprobado', async () => {
    mockMercadoPagoPayment(approved({ status: 'pending' }))
    await POST(post(URL_, { type: 'payment', data: { id: '123' } }))
    expect(fake.updates).toHaveLength(0)
  })

  it('no activa si se pagó menos que el precio del plan', async () => {
    mockMercadoPagoPayment(approved({ transaction_amount: 1 }))
    await POST(post(URL_, { type: 'payment', data: { id: '123' } }))
    expect(fake.updates).toHaveLength(0)
  })

  it('usa el precio del rol: un propietario tiene que pagar $3.990', async () => {
    mockMercadoPagoPayment(approved({ transaction_amount: 2990, metadata: { profile_id: 'perfil-2' } }))
    await POST(post(URL_, { type: 'payment', data: { id: '123' } }))
    expect(fake.updates).toHaveLength(0)
  })

  it('no activa si la moneda no es pesos', async () => {
    mockMercadoPagoPayment(approved({ currency_id: 'USD', transaction_amount: 5000 }))
    await POST(post(URL_, { type: 'payment', data: { id: '123' } }))
    expect(fake.updates).toHaveLength(0)
  })

  it('ignora avisos que no son de pagos (merchant_order)', async () => {
    const fetchMock = mockMercadoPagoPayment(approved())
    await POST(post(URL_, { type: 'merchant_order', data: { id: '999' } }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(fake.updates).toHaveLength(0)
  })

  it('no confía en un ID raro: no llama a MercadoPago', async () => {
    const fetchMock = mockMercadoPagoPayment(approved())
    const res = await POST(post(URL_, { type: 'payment', data: { id: '../../otra-cosa' } }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(res.status).toBe(502)
  })

  it('responde error (para que MercadoPago reintente) si no puede consultar el pago', async () => {
    mockMercadoPagoPayment(null, 500)
    const res = await POST(post(URL_, { type: 'payment', data: { id: '123' } }))
    expect(res.status).toBe(502)
  })

  it('responde error (para que MercadoPago reintente) si falla la base de datos', async () => {
    mockMercadoPagoPayment(approved())
    fake.failUpdates()
    const res = await POST(post(URL_, { type: 'payment', data: { id: '123' } }))
    expect(res.status).toBe(500)
  })

  it('no hace nada si el perfil ya es premium', async () => {
    fake = createFakeSupabase({ profiles: [{ id: 'perfil-1', role: 'conductor', plan: 'premium' }] })
    mockMercadoPagoPayment(approved())
    const res = await POST(post(URL_, { type: 'payment', data: { id: '123' } }))
    expect(res.status).toBe(200)
    expect(fake.updates).toHaveLength(0)
  })
})
