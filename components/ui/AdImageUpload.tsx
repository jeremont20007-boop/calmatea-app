'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

interface AdImageUploadProps {
  label: string
  slot: 'mobile' | 'desktop'
  requiredWidth: number
  requiredHeight: number
  maxSizeMB: number
  advertiserId: string
  value?: string
  onChange: (url: string | undefined) => void
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export function AdImageUpload({
  label, slot, requiredWidth, requiredHeight, maxSizeMB, advertiserId, value, onChange,
}: AdImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const ratio = requiredWidth / requiredHeight

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setDims(null)

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Solo se acepta JPG o PNG.')
      return
    }

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      setError(`El archivo supera ${maxSizeMB}MB (tiene ${sizeMB.toFixed(1)}MB).`)
      return
    }

    const { width, height } = await getImageDimensions(file)
    setDims({ w: width, h: height })

    // Enforce minimum dimensions (90% tolerance for slight undersize)
    if (width < requiredWidth * 0.9 || height < requiredHeight * 0.9) {
      setError(
        `Dimensiones insuficientes: la imagen tiene ${width}×${height}px. Mínimo: ${requiredWidth}×${requiredHeight}px.`
      )
      return
    }

    setUploading(true)

    const supabase = createClient()
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const path = `${advertiserId}/${slot}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('ads-media')
      .upload(path, file, { contentType: file.type, upsert: true })

    if (uploadError) {
      setError('Error al subir la imagen. Verificá que el bucket "ads-media" exista en Supabase Storage.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('ads-media').getPublicUrl(path)
    onChange(publicUrl)
    setUploading(false)
  }

  function remove() {
    onChange(undefined)
    setDims(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <label className="text-sm font-extrabold text-calm-700">{label}</label>
        {dims && !error && (
          <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold">
            <CheckCircle size={11} />
            {dims.w}×{dims.h}px
          </span>
        )}
      </div>

      {/* Spec badge */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[10px] bg-calm-100 text-calm-600 font-bold px-2 py-0.5 rounded-full">
          JPG o PNG
        </span>
        <span className="text-[10px] bg-calm-100 text-calm-600 font-bold px-2 py-0.5 rounded-full">
          {requiredWidth}×{requiredHeight}px mín.
        </span>
        <span className="text-[10px] bg-calm-100 text-calm-600 font-bold px-2 py-0.5 rounded-full">
          Máx {maxSizeMB}MB
        </span>
        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
          {slot === 'mobile' ? '📱 Mobile slider' : '🖥️ Web banner'}
        </span>
      </div>

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-green-300 bg-calm-50">
          <img
            src={value}
            alt={label}
            className="w-full object-cover"
            style={{ aspectRatio: `${ratio}` }}
          />
          <button
            type="button"
            onClick={remove}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
          >
            <X size={13} />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {slot === 'mobile' ? 'MOBILE' : 'DESKTOP'}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-calm-300 hover:border-calm-500 hover:bg-calm-50 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:pointer-events-none py-8"
        >
          {uploading ? (
            <>
              <div className="w-7 h-7 border-2 border-calm-300 border-t-calm-600 rounded-full animate-spin" />
              <span className="text-xs font-semibold text-calm-500">Subiendo imagen...</span>
            </>
          ) : (
            <>
              <Upload size={26} className="text-calm-400" />
              <span className="text-sm font-extrabold text-calm-600">
                {slot === 'mobile' ? 'Subir imagen móvil' : 'Subir imagen web'}
              </span>
              <span className="text-xs text-calm-400 font-semibold">
                {requiredWidth}×{requiredHeight}px · JPG/PNG · ≤{maxSizeMB}MB
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleFile}
      />

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 font-semibold">{error}</p>
        </div>
      )}
    </div>
  )
}
