'use client'

import { useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/lazy-client'
import {
  DOCUMENTS_BUCKET, DOCUMENT_LINK_SECONDS, MAX_DOCUMENT_BYTES,
  buildDocumentPath, hasDocumentFile, type DocumentEntityType,
} from '@/lib/documents'
import { Upload, Check, AlertCircle, FileText, Eye } from 'lucide-react'

interface DocumentUploadProps {
  docType: string
  label: string
  description?: string
  required?: boolean
  /** Lo guardado en file_url (ubicación del archivo en el bucket privado). */
  existingUrl?: string | null
  /** Link temporal firmado para ver el archivo, generado en el servidor. */
  viewUrl?: string | null
  existingStatus?: string
  entityId: string
  entityType: DocumentEntityType
}

export function DocumentUpload({
  docType,
  label,
  description,
  required = false,
  existingUrl,
  viewUrl,
  existingStatus,
  entityId,
  entityType,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(hasDocumentFile(existingUrl))
  const [linkUrl, setLinkUrl] = useState(viewUrl || '')
  const [status, setStatus] = useState(existingStatus || '')
  const [error, setError] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Permite volver a elegir el mismo archivo si algo falla
    e.target.value = ''

    const path = buildDocumentPath(entityType, entityId, docType, file.type)
    if (!path) {
      setError('Solo se aceptan PDF, JPG, PNG o WEBP')
      return
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
      setError('El archivo no puede superar 10 MB')
      return
    }

    setUploading(true)
    setError('')

    const supabase = await getBrowserClient()

    // El bucket "documents" es privado: sólo el dueño (y el admin) pueden verlo.
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      // Antes se registraba igual el documento, apuntando a un archivo que no existía.
      setError('No se pudo subir el archivo. Intentá de nuevo.')
      setUploading(false)
      return
    }

    const table = entityType === 'driver' ? 'driver_documents' : 'vehicle_documents'
    const idField = entityType === 'driver' ? 'driver_id' : 'vehicle_id'

    // Se guarda la ubicación del archivo, no un link público.
    const { error: dbError } = await supabase.from(table).upsert(
      { [idField]: entityId, doc_type: docType, file_url: path, status: 'pendiente' },
      { onConflict: `${idField},doc_type` }
    )

    if (dbError) {
      setError('Error al registrar el documento.')
      setUploading(false)
      return
    }

    // Link temporal para que el usuario pueda ver lo que acaba de subir
    const { data: signed } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(path, DOCUMENT_LINK_SECONDS)

    setUploading(false)
    setUploaded(true)
    setStatus('pendiente')
    setLinkUrl(signed?.signedUrl ?? '')
    setError('')
  }

  const statusStyles: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobado: 'bg-green-100 text-green-700',
    rechazado: 'bg-red-100 text-red-600',
  }

  const statusLabels: Record<string, string> = {
    pendiente: 'En revisión',
    aprobado: 'Aprobado ✓',
    rechazado: 'Rechazado',
  }

  return (
    <div data-doc-type={docType} className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-colors ${
      uploaded ? 'border-calm-200 bg-white' : 'border-dashed border-calm-200 bg-calm-50/50'
    }`}>
      {/* Icon */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        status === 'aprobado' ? 'bg-green-100' :
        uploaded ? 'bg-calm-100' : 'bg-white border-2 border-calm-200'
      }`}>
        {status === 'aprobado'
          ? <Check size={16} className="text-green-600" />
          : uploaded
          ? <FileText size={16} className="text-calm-500" />
          : <FileText size={16} className="text-calm-300" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-calm-800 text-sm">
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
          </p>
          {uploaded && status && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-500'}`}>
              {statusLabels[status] || status}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-calm-400 mt-0.5 leading-snug">{description}</p>
        )}
        {error && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={11} /> {error}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {uploaded && linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-calm-50 text-calm-400 hover:text-calm-600 hover:bg-calm-100 transition-colors"
            title="Ver documento"
          >
            <Eye size={14} />
          </a>
        )}
        <label className={uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleUpload}
            className="sr-only"
            disabled={uploading}
          />
          <span className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
            uploaded
              ? 'bg-calm-50 text-calm-500 hover:bg-calm-100'
              : 'bg-calm-500 text-white hover:bg-calm-600'
          }`}>
            <Upload size={11} />
            {uploading ? '...' : uploaded ? 'Cambiar' : 'Subir'}
          </span>
        </label>
      </div>
    </div>
  )
}
