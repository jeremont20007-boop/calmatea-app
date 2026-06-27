'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AD_STATUS_LABELS, AD_STATUS_COLORS, type Ad } from '@/types'

export default function EditarAnuncioPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [ctaText, setCtaText] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('ads').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        const a = data as unknown as Ad
        setAd(a)
        setTitle(a.title)
        setDescription(a.description ?? '')
        setImageUrl(a.image_url ?? '')
        setTargetUrl(a.target_url)
        setCtaText(a.cta_text)
      }
      setLoading(false)
    })
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('ads')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        target_url: targetUrl.trim(),
        cta_text: ctaText.trim() || 'Ver más',
        status: 'pending_review',
      })
      .eq('id', id)

    if (updateError) {
      setError('Error al guardar. Intentá de nuevo.')
      setSaving(false)
      return
    }

    router.push('/anuncios')
    router.refresh()
  }

  async function handlePause() {
    const supabase = createClient()
    await supabase.from('ads').update({ status: ad?.status === 'active' ? 'paused' : 'pending_review' }).eq('id', id)
    router.push('/anuncios')
  }

  if (loading) {
    return <div className="p-4 text-center text-calm-400 text-sm pt-16">Cargando...</div>
  }

  if (!ad) {
    return <div className="p-4 text-center text-calm-400 text-sm pt-16">Anuncio no encontrado.</div>
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-calm-800">Editar anuncio</h1>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${AD_STATUS_COLORS[ad.status]}`}>
          {AD_STATUS_LABELS[ad.status]}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <Input
            id="title"
            label="Título"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 60))}
            required
          />
          <div>
            <label className="block text-sm font-semibold text-calm-700 mb-1.5">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 120))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 bg-white text-calm-800 font-medium placeholder:text-calm-300 focus:outline-none focus:border-calm-400 transition-colors text-sm resize-none"
            />
          </div>
          <Input
            id="imageUrl"
            label="URL de imagen"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            type="url"
          />
          <Input
            id="targetUrl"
            label="URL de destino"
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            required
            type="url"
          />
          <Input
            id="ctaText"
            label="Texto del botón"
            value={ctaText}
            onChange={e => setCtaText(e.target.value.slice(0, 30))}
          />
        </section>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar y enviar para revisión'}
        </Button>

        {(ad.status === 'active' || ad.status === 'pending_review') && (
          <button
            type="button"
            onClick={handlePause}
            className="w-full py-3 rounded-2xl border-2 border-calm-200 text-calm-500 font-bold text-sm hover:border-calm-400 transition-colors"
          >
            {ad.status === 'active' ? 'Pausar anuncio' : 'Cancelar revisión y volver a borrador'}
          </button>
        )}
      </form>
    </div>
  )
}
