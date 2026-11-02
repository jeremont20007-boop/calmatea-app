import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { from, resetMocks, storageBucket, storageFrom, upsert } from '../mocks'
import { DocumentUpload } from '@/components/ui/DocumentUpload'

const ID = '20000000-0000-4000-8000-000000000001'

function renderUpload(props: Partial<React.ComponentProps<typeof DocumentUpload>> = {}) {
  const { container } = render(
    <DocumentUpload docType="dni_frente" label="DNI (frente)" entityId={ID} entityType="driver" {...props} />
  )
  return container.querySelector('input[type=file]') as HTMLInputElement
}

const jpg = () => new File(['x'], 'mi dni.JPG', { type: 'image/jpeg' })

describe('DocumentUpload (bucket privado)', () => {
  beforeEach(() => {
    resetMocks()
    storageBucket.upload.mockResolvedValue({ error: null })
    storageBucket.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://firmado/dni' }, error: null })
    upsert.mockResolvedValue({ error: null })
  })

  it('sube al bucket privado y guarda la UBICACIÓN del archivo, no un link público', async () => {
    const input = renderUpload()
    await userEvent.upload(input, jpg())

    await waitFor(() => expect(upsert).toHaveBeenCalled())
    expect(storageFrom).toHaveBeenCalledWith('documents')
    expect(storageBucket.upload).toHaveBeenCalledWith(`driver/${ID}/dni_frente.jpg`, expect.any(File), {
      upsert: true,
      contentType: 'image/jpeg',
    })
    expect(from).toHaveBeenCalledWith('driver_documents')
    expect(upsert).toHaveBeenCalledWith(
      { driver_id: ID, doc_type: 'dni_frente', file_url: `driver/${ID}/dni_frente.jpg`, status: 'pendiente' },
      { onConflict: 'driver_id,doc_type' }
    )
    expect(storageBucket.getPublicUrl).not.toHaveBeenCalled()
  })

  it('después de subir muestra "En revisión" y un link temporal para verlo', async () => {
    const input = renderUpload()
    await userEvent.upload(input, jpg())
    expect(await screen.findByText('En revisión')).toBeInTheDocument()
    expect(screen.getByTitle('Ver documento')).toHaveAttribute('href', 'https://firmado/dni')
  })

  it('si falla la subida NO registra el documento', async () => {
    storageBucket.upload.mockResolvedValue({ error: { message: 'new row violates row-level security policy' } })
    const input = renderUpload()
    await userEvent.upload(input, jpg())

    expect(await screen.findByText('No se pudo subir el archivo. Intentá de nuevo.')).toBeInTheDocument()
    expect(upsert).not.toHaveBeenCalled()
    expect(screen.queryByText('En revisión')).not.toBeInTheDocument()
  })

  it('rechaza tipos de archivo no permitidos sin subir nada', async () => {
    const input = renderUpload()
    const html = new File(['<script>'], 'dni.html', { type: 'text/html' })
    await userEvent.upload(input, html, { applyAccept: false })
    expect(await screen.findByText('Solo se aceptan PDF, JPG, PNG o WEBP')).toBeInTheDocument()
    expect(storageBucket.upload).not.toHaveBeenCalled()
  })

  it('rechaza archivos de más de 10 MB', async () => {
    const input = renderUpload()
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'dni.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, big)
    expect(await screen.findByText('El archivo no puede superar 10 MB')).toBeInTheDocument()
    expect(storageBucket.upload).not.toHaveBeenCalled()
  })

  it('un documento ya subido usa el link temporal que generó el servidor', () => {
    renderUpload({ existingUrl: `driver/${ID}/dni_frente.jpg`, viewUrl: 'https://firmado/viejo', existingStatus: 'aprobado' })
    expect(screen.getByText('Aprobado ✓')).toBeInTheDocument()
    expect(screen.getByTitle('Ver documento')).toHaveAttribute('href', 'https://firmado/viejo')
  })

  it('un registro viejo que nunca se subió ("pending:") se muestra como pendiente de subir', () => {
    renderUpload({ existingUrl: `pending:driver/${ID}/dni_frente`, existingStatus: 'pendiente' })
    expect(screen.getByText('Subir')).toBeInTheDocument()
    expect(screen.queryByTitle('Ver documento')).not.toBeInTheDocument()
  })
})
