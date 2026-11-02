import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdBanner } from '@/components/ui/AdBanner'

const AD = {
  id: 'ad-1',
  title: 'Seguros para remises',
  description: 'Cotizá en 5 minutos',
  target_url: 'https://example.test/seguros',
  cta_text: 'Cotizar',
  advertiser_name: 'Aseguradora de Prueba',
}

function mockFetch(body: unknown) {
  const fn = vi.fn().mockResolvedValue({ json: () => Promise.resolve(body) })
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('AdBanner', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('muestra el anuncio devuelto por la API', async () => {
    const fetchMock = mockFetch({ ad: AD })
    render(<AdBanner />)
    expect(await screen.findByText('Seguros para remises')).toBeInTheDocument()
    expect(screen.getByText('Aseguradora de Prueba')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cotizar/ })).toHaveAttribute('href', AD.target_url)
    expect(fetchMock).toHaveBeenCalledWith('/api/ads/random')
  })

  it('no muestra nada si no hay anuncios', async () => {
    const fetchMock = mockFetch({ ad: null })
    const { container } = render(<AdBanner />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('se puede cerrar', async () => {
    mockFetch({ ad: AD })
    render(<AdBanner />)
    await screen.findByText('Seguros para remises')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar anuncio' }))
    expect(screen.queryByText('Seguros para remises')).not.toBeInTheDocument()
  })

  it('a usuarios premium no les vuelve a mostrar anuncios antes de 6 horas', async () => {
    localStorage.setItem('vl_ad_ts', String(Date.now() - 60 * 60 * 1000)) // hace 1 hora
    const fetchMock = mockFetch({ ad: AD })
    render(<AdBanner isPremium />)
    await new Promise(r => setTimeout(r, 20))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a usuarios premium sí les muestra si pasaron más de 6 horas', async () => {
    localStorage.setItem('vl_ad_ts', String(Date.now() - 7 * 60 * 60 * 1000))
    mockFetch({ ad: AD })
    render(<AdBanner isPremium />)
    expect(await screen.findByText('Seguros para remises')).toBeInTheDocument()
  })
})
