'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import {
  CREATIVE_TIERS, CREATIVE_DELIVERABLES,
  CREATIVE_STATUS_LABELS, CREATIVE_STATUS_COLORS,
  type CreativeRequest, type Ad,
} from '@/types'
import { Sparkles, CheckCircle } from 'lucide-react'

export default function SolicitarCreatividadPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [ad, setAd] = useState<Ad | null>(null)
  const [existing, setExisting] = useState<CreativeRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [selectedTier, setSelectedTier] = useState(1)
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const availableOptions = CREATIVE_DELIVERABLES.filter(d => d.tier <= selectedTier)
  const currentTier = CREATIVE_TIERS.find(t => t.tier === selectedTier)!

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [{ data: adData }, { data: { user } }] = await Promise.all([
        supabase.from('ads').select('id, title, status, advertiser_id').eq('id', id).single(),
        supabase.auth.getUser(),
      ])

      if (adData) setAd(adData as unknown as Ad)

      if (user) {
        const { data: req } = await supabase
          .from('creative_requests')
          .select('*')
          .eq('ad_id', id)
          .maybeSingle()
        if (req) {
          const r = req as CreativeRequest
          setExisting(r)
          setSelectedTier(r.tier)
          setSelectedDeliverables(r.selected_deliverables)
          setNotes(r.notes ?? '')
        }
      }

      setLoading(false)
    }

    load()
  }, [id])

  function handleTierChange(tier: number) {
    setSelectedTier(tier)
    const available = CREATIVE_DELIVERABLES.filter(d => d.tier <= tier).map(d => d.id)
    setSelectedDeliverables(prev => prev.filter(x => available.includes(x)))
  }

  function toggleDeliverable(delivId: string) {
    setSelectedDeliverables(prev =>
      prev.includes(delivId) ? prev.filter(x => x !== delivId) : [...prev, delivId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedDeliverables.length === 0) {
      setError('Seleccioná al menos una opción de entrega.')
      return
    }

    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: advertiser } = await supabase
      .from('advertisers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!advertiser) {
      setError('No se encontró tu cuenta de publicitario.')
      setSubmitting(false)
      return
    }

    const payload = {
      ad_id: id,
      advertiser_id: advertiser.id,
      tier: selectedTier,
      selected_deliverables: selectedDeliverables,
      notes: notes.trim() || null,
      price_ars: currentTier.priceARS,
      status: 'pending' as const,
    }

    let dbError
    if (existing) {
      const { error: e } = await supabase
        .from('creative_requests')
        .update(payload)
        .eq('id', existing.id)
      dbError = e
    } else {
      const { error: e } = await supabase
        .from('creative_requests')
        .insert(payload)
      dbError = e
    }

    if (dbError) {
      setError('Error al enviar la solicitud. Intentá de nuevo.')
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => router.push(`/anuncios/${id}`), 2500)
  }

  if (loading) return <div className="p-4 text-center text-calm-400 text-sm pt-20">Cargando...</div>
  if (!ad) return <div className="p-4 text-center text-calm-400 text-sm pt-20">Anuncio no encontrado.</div>

  return (
    <div className="p-4 space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-extrabold text-calm-800">Solicitar creatividad</h1>
        <p className="text-sm text-calm-500 mt-0.5">
          Para el anuncio: <strong className="text-calm-700">{ad.title}</strong>
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3">
          <CheckCircle size={20} className="text-green-500 shrink-0" />
          <div>
            <p className="font-bold text-green-800 text-sm">¡Solicitud enviada!</p>
            <p className="text-xs text-green-700 mt-0.5">
              Un asesor se comunicará con vos para coordinar el pago y el briefing.
            </p>
          </div>
        </div>
      )}

      {existing && !success && (
        <div className={`px-3 py-2 rounded-xl border text-xs font-bold border-transparent ${CREATIVE_STATUS_COLORS[existing.status]}`}>
          Estado actual: {CREATIVE_STATUS_LABELS[existing.status]}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tier selector */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <div>
            <h2 className="font-extrabold text-calm-700 text-lg flex items-center gap-2">
              <Sparkles size={18} className="text-calm-500" />
              Elegí tu plan de creatividad
            </h2>
            <p className="text-xs text-calm-400 mt-0.5">
              Mayor nivel = más formatos disponibles para elegir.
            </p>
          </div>

          <div className="space-y-2">
            {CREATIVE_TIERS.map(t => (
              <label
                key={t.tier}
                className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedTier === t.tier
                    ? 'border-calm-500 bg-calm-50'
                    : 'border-calm-100 hover:border-calm-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="tier"
                    value={t.tier}
                    checked={selectedTier === t.tier}
                    onChange={() => handleTierChange(t.tier)}
                    className="accent-calm-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-calm-800">
                        {t.tier === 7 ? '✦ Premium' : t.label}
                      </span>
                      {t.tier < 7 && (
                        <span className="text-yellow-400 text-sm leading-none">
                          {'★'.repeat(t.tier)}{'☆'.repeat(6 - t.tier)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-calm-400">
                      Hasta {t.optionCount} entregables para elegir
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-calm-700">
                    ${t.priceARS.toLocaleString('es-AR')}
                  </p>
                  <p className="text-[10px] text-calm-400">ARS</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Deliverables picker */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-3">
          <div>
            <h2 className="font-extrabold text-calm-700">¿Qué querés recibir?</h2>
            <p className="text-xs text-calm-400 mt-0.5">
              Con tu plan <strong>{currentTier.tier === 7 ? 'Premium' : currentTier.label}</strong> podés elegir entre {availableOptions.length} opciones.
            </p>
          </div>

          {availableOptions.map(d => (
            <label
              key={d.id}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedDeliverables.includes(d.id)
                  ? 'border-calm-500 bg-calm-50'
                  : 'border-calm-100 hover:border-calm-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedDeliverables.includes(d.id)}
                onChange={() => toggleDeliverable(d.id)}
                className="accent-calm-500 mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="font-bold text-calm-800 text-sm">{d.label}</p>
                <p className="text-xs text-calm-400 mt-0.5">{d.description}</p>
              </div>
            </label>
          ))}
        </section>

        {/* Notes */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-3">
          <h2 className="font-extrabold text-calm-700">Información adicional</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value.slice(0, 500))}
            placeholder="Contanos sobre tu marca, colores, estilo visual, qué querés comunicar..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 bg-white text-calm-800 font-medium placeholder:text-calm-300 focus:outline-none focus:border-calm-400 transition-colors text-sm resize-none"
          />
          <p className="text-xs text-calm-400">{notes.length}/500 caracteres</p>
        </section>

        {/* Summary */}
        <div className="bg-calm-500 rounded-2xl p-4 text-white flex items-center justify-between">
          <div>
            <p className="text-calm-200 text-xs font-semibold">Total del servicio</p>
            <p className="text-3xl font-extrabold">
              ${currentTier.priceARS.toLocaleString('es-AR')}
            </p>
            <p className="text-calm-300 text-xs mt-0.5">
              ARS · {currentTier.tier === 7 ? 'Plan Premium' : currentTier.label}
              {selectedDeliverables.length > 0 && ` · ${selectedDeliverables.length} entregable${selectedDeliverables.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Sparkles size={36} className="text-calm-300" />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-700">
          💳 El pago se coordina por separado. Al enviar esta solicitud, un asesor se comunicará con vos para completar el proceso y recibir el briefing.
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={submitting || success}>
          {submitting
            ? 'Enviando...'
            : existing
            ? 'Actualizar solicitud'
            : 'Solicitar creatividad'}
        </Button>
      </form>
    </div>
  )
}
