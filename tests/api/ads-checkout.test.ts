// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { post } from './fakeSupabase'

let ad: Record<string, unknown> | null
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: ad }) }) }),
    }),
  }),
}))

import { POST } from '@/app/api/ads/checkout/route'

const URL_ = 'http://localhost:3000/api/ads/checkout'

describe('Checkout de anuncios', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    ad = {
      id: 'anuncio-1',
      title: 'Mi anuncio',
      total_price: 1, // precio "tramposo" guardado
      payment_status: 'pending',
      duration_days: 30,
      advertiser: { user_id: 'user-1' },
    }
    fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ init_point: 'https://mp.test/pagar' }) })
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('cobra el precio según la duración, no el precio guardado en el anuncio', async () => {
    const res = await POST(post(URL_, { adId: 'anuncio-1' }))
    expect(await res.json()).toEqual({ url: 'https://mp.test/pagar' })
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent.items[0].unit_price).toBe(13500) // 30 días
  })

  it('rechaza una duración que no existe', async () => {
    ad!.duration_days = 365
    const res = await POST(post(URL_, { adId: 'anuncio-1' }))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('no deja pagar el anuncio de otro', async () => {
    ad!.advertiser = { user_id: 'otro' }
    const res = await POST(post(URL_, { adId: 'anuncio-1' }))
    expect(res.status).toBe(403)
  })
})
