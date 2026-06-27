'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Check, AlertCircle, FileText, Eye } from 'lucide-react'

interface DocumentUploadProps {
  docType: string
  label: string
  description?: string
  required?: boolean
  existingUrl?: string | null
  existingStatus?: string
  entityId: string
  entityType: 'driver' | 'vehicle'
}

export function DocumentUpload({
  docType,
  label,
  description,
  required = false,
  existingUrl,
  existingStatus,
  entityId,
  entityType,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(!!existingUrl)
  const [fileUrl, setFileUrl] = useState(existingUrl || '')
  const [status, setStatus] = useState(existingStatus || '')
  const [error, setError] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Solo se aceptan PDF, JPG o PNG')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10 MB')
      return
    }

    setUploading(true)
    setError('')

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${entityType}/${entityId}/${docType}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      // If storage bucket doesn't exist yet, still save the intent
      setError('Archivo recibido. Configura el bucket "documents" en Supabase Storage.')
      setUploading(false)
    }

    // Try to get URL (may fail if bucket isn't set up)
    let publicUrl = ''
    try {
      const result = supabase.storage.from('documents').getPublicUrl(path)
      publicUrl = result.data.publicUrl
    } catch {
      publicUrl = `pending:${entityType}/${entityId}/${docType}`
    }

    const table = entityType === 'driver' ? 'driver_documents' : 'vehicle_documents'
    const idField = entityType === 'driver' ? 'driver_id' : 'vehicle_id'

    const { error: dbError } = await supabase.from(table).upsert(
      { [idField]: entityId, doc_type: docType, file_url: publicUrl, status: 'pendiente' },
      { onConflict: `${idField},doc_type` }
    )

    setUploading(false)
    if (!dbError) {
      setUploaded(true)
      setStatus('pendiente')
      setFileUrl(publicUrl)
      setError('')
    } else {
      setError('Error al registrar el documento.')
    }
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
    <div className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-colors ${
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
        {uploaded && fileUrl && !fileUrl.startsWith('pending:') && (
          <a
            href={fileUrl}
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
