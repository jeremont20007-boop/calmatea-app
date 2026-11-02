import { describe, expect, it, vi } from 'vitest'
import {
  buildDocumentPath, documentPathFromFileUrl, hasDocumentFile, signDocumentUrls, DOCUMENT_LINK_SECONDS,
} from '@/lib/documents'

const ID = '20000000-0000-4000-8000-000000000001'

describe('buildDocumentPath', () => {
  it('arma la ubicación con la extensión según el tipo real del archivo', () => {
    expect(buildDocumentPath('driver', ID, 'dni_frente', 'image/jpeg')).toBe(`driver/${ID}/dni_frente.jpg`)
    expect(buildDocumentPath('vehicle', ID, 'cedula_verde', 'application/pdf')).toBe(`vehicle/${ID}/cedula_verde.pdf`)
  })

  it('rechaza tipos de archivo no permitidos', () => {
    expect(buildDocumentPath('driver', ID, 'dni_frente', 'text/html')).toBeNull()
    expect(buildDocumentPath('driver', ID, 'dni_frente', 'image/svg+xml')).toBeNull()
  })
})

describe('documentPathFromFileUrl', () => {
  it.each([
    [`driver/${ID}/dni_frente.jpg`, `driver/${ID}/dni_frente.jpg`],
    // Formato viejo: link público completo
    [`https://abc.supabase.co/storage/v1/object/public/documents/driver/${ID}/dni_frente.jpg`, `driver/${ID}/dni_frente.jpg`],
    // Link firmado
    [`https://abc.supabase.co/storage/v1/object/sign/documents/driver/${ID}/x.pdf?token=abc`, `driver/${ID}/x.pdf`],
  ])('%s → %s', (input, expected) => {
    expect(documentPathFromFileUrl(input)).toBe(expected)
  })

  it.each([null, undefined, '', `pending:driver/${ID}/dni_frente`, 'https://otro-sitio.test/archivo.pdf'])(
    'sin archivo: %s',
    input => {
      expect(documentPathFromFileUrl(input as string)).toBeNull()
      expect(hasDocumentFile(input as string)).toBe(false)
    }
  )

  it('no confunde el bucket público de anuncios con el de documentos', () => {
    expect(documentPathFromFileUrl('https://abc.supabase.co/storage/v1/object/public/ads-media/x.png')).toBeNull()
  })
})

describe('signDocumentUrls', () => {
  function fakeSupabase(result: { data: unknown; error: unknown }) {
    const createSignedUrls = vi.fn().mockResolvedValue(result)
    return {
      createSignedUrls,
      client: { storage: { from: vi.fn(() => ({ createSignedUrls })) } } as never,
    }
  }

  it('genera links temporales de 1 hora, uno por archivo, y los asocia a lo guardado en la base', async () => {
    const legacy = `https://abc.supabase.co/storage/v1/object/public/documents/driver/${ID}/a.pdf`
    const nuevo = `driver/${ID}/b.jpg`
    const { client, createSignedUrls } = fakeSupabase({
      data: [
        { path: `driver/${ID}/a.pdf`, signedUrl: 'https://firmado/a', error: null },
        { path: `driver/${ID}/b.jpg`, signedUrl: 'https://firmado/b', error: null },
      ],
      error: null,
    })

    const result = await signDocumentUrls(client, [legacy, nuevo, null, `pending:x`])

    expect(createSignedUrls).toHaveBeenCalledWith([`driver/${ID}/a.pdf`, `driver/${ID}/b.jpg`], DOCUMENT_LINK_SECONDS)
    expect(result).toEqual({ [legacy]: 'https://firmado/a', [nuevo]: 'https://firmado/b' })
  })

  it('omite los que no se pudieron firmar (sin permiso o archivo inexistente)', async () => {
    const { client } = fakeSupabase({
      data: [{ path: `driver/${ID}/a.pdf`, signedUrl: null, error: 'Object not found' }],
      error: null,
    })
    expect(await signDocumentUrls(client, [`driver/${ID}/a.pdf`])).toEqual({})
  })

  it('si no hay documentos no llama a Supabase', async () => {
    const { client, createSignedUrls } = fakeSupabase({ data: [], error: null })
    expect(await signDocumentUrls(client, [null, undefined])).toEqual({})
    expect(createSignedUrls).not.toHaveBeenCalled()
  })

  it('si Supabase falla devuelve vacío (la página muestra "Sin archivo")', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { client } = fakeSupabase({ data: null, error: { message: 'boom' } })
    expect(await signDocumentUrls(client, [`driver/${ID}/a.pdf`])).toEqual({})
  })
})
