'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Info } from 'lucide-react'

export default function NuevoAnuncioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [ctaText, setCtaText] = useState('Ver más')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [maxImpressions, setMaxImpressions] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!targetUrl.startsWith('http')) {
      setError('La URL de destino debe comenzar con http:// o https://')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/publicitario'); return }

    const { data: advertiser } = await supabase
      .from('advertisers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!advertiser) {
      setError('No se encontró tu cuenta de publicitario.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('ads').insert({
      advertiser_id: advertiser.id,
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      target_url: targetUrl.trim(),
      cta_text: ctaText.trim() || 'Ver más',
      status: 'pending_review',
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      max_impressions: maxImpressions ? parseInt(maxImpressions) : null,
    })

    if (insertError) {
      setError('Error al crear el anuncio. Intentá de nuevo.')
      setLoading(false)
      return
    }

    router.push('/anuncios')
    router.refresh()
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-extrabold text-calm-800">Crear anuncio</h1>
        <p className="text-sm text-calm-500 mt-0.5">
          Será revisado por nuestro equipo antes de publicarse.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Contenido */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <h2 className="font-extrabold text-calm-700">Contenido del anuncio</h2>

          <div>
            <Input
              id="title"
              label="Título"
              placeholder="Remis económico en Neuquén"
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 60))}
              required
            />
            <p className="text-xs text-calm-400 mt-1">{title.length}/60 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-calm-700 mb-1.5">
              Descripción <span className="text-calm-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 120))}
              placeholder="Breve descripción de tu oferta o servicio..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 bg-white text-calm-800 font-medium placeholder:text-calm-300 focus:outline-none focus:border-calm-400 transition-colors text-sm resize-none"
            />
            <p className="text-xs text-calm-400 mt-1">{description.length}/120 caracteres</p>
          </div>

          <Input
            id="imageUrl"
            label="URL de imagen (opcional)"
            placeholder="https://miempresa.com/logo.png"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            type="url"
          />

          <Input
            id="targetUrl"
            label="URL de destino"
            placeholder="https://miempresa.com/oferta"
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            required
            type="url"
          />

          <Input
            id="ctaText"
            label="Texto del botón"
            placeholder="Ver más"
            value={ctaText}
            onChange={e => setCtaText(e.target.value.slice(0, 30))}
          />
        </section>

        {/* Vigencia */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <h2 className="font-extrabold text-calm-700">Vigencia y límites</h2>
          <p className="text-xs text-calm-400">
            Dejá en blanco para que el anuncio esté activo sin fecha límite.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-calm-700 mb-1.5">Inicio</label>
              <input
                type="date"
                value={startsAt}
                onChange={e => setStartsAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-calm-200 bg-white text-calm-800 text-sm focus:outline-none focus:border-calm-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-calm-700 mb-1.5">Fin</label>
              <input
                type="date"
                value={endsAt}
                onChange={e => setEndsAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-calm-200 bg-white text-calm-800 text-sm focus:outline-none focus:border-calm-400"
              />
            </div>
          </div>

          <Input
            id="maxImpressions"
            label="Máximo de impresiones (opcional)"
            placeholder="5000"
            type="number"
            min="100"
            value={maxImpressions}
            onChange={e => setMaxImpressions(e.target.value)}
          />
        </section>

        {/* Info pricing */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-800">Tarifas de publicidad</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Una vez aprobado tu anuncio, recibirás una propuesta económica personalizada.
              Para consultas: <span className="font-semibold">publicidad@vehilink.com.ar</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Enviando para revisión...' : 'Enviar para revisión'}
        </Button>
      </form>
    </div>
  )
}
