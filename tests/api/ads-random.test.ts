// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ rpc }) }))

import { GET, dynamic } from '@/app/api/ads/random/route'

describe('GET /api/ads/random', () => {
  beforeEach(() => {
    rpc.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('nunca se cachea (cada pedido cuenta una impresión)', () => {
    expect(dynamic).toBe('force-dynamic')
  })

  it('usa la función de la base que elige el anuncio y cuenta la impresión', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: 'ad-1',
          title: 'Seguros',
          description: null,
          mobile_image_url: 'https://img.test/m.png',
          desktop_image_url: null,
          target_url: 'https://example.test',
          cta_text: 'Cotizar',
          advertiser_name: 'Aseguradora',
        },
      ],
      error: null,
    })
    const res = await GET()
    expect(rpc).toHaveBeenCalledWith('serve_random_ad')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toEqual({
      ad: {
        id: 'ad-1',
        title: 'Seguros',
        mobile_image_url: 'https://img.test/m.png',
        target_url: 'https://example.test',
        cta_text: 'Cotizar',
        advertiser_name: 'Aseguradora',
      },
    })
  })

  it('sin anuncios devuelve ad: null', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    expect(await (await GET()).json()).toEqual({ ad: null })
  })

  it('si falla la base devuelve ad: null (el banner simplemente no aparece)', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect(await (await GET()).json()).toEqual({ ad: null })
  })
})
