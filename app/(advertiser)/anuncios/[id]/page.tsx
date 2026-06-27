'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AdImageUpload } from '@/components/ui/AdImageUpload'
import { AD_STATUS_LABELS, AD_STATUS_COLORS, calcAdPrice, type Ad } from '@/types'
import { CreditCard, CheckCircle, Eye, Sparkles } from 'lucide-react'
import Link from 'next/link'

const MOBILE_SPEC = { width: 750, height: 300, maxMB: 2 }
const DESKTOP_SPEC = { width: 1200, height: 400, maxMB: 3 }

export default function EditarAnuncioPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const justPaid = searchParams.get('paid') === '1'
  const checkoutError = searchParams.get('checkout_error') === '1'

  const [ad, setAd] = useState<Ad | null>(null)
  const [advertiserId, setAdvertiserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mobileImageUrl, setMobileImageUrl] = useState<string | undefined>()
  const [desktopImageUrl, setDesktopImageUrl] = useState<string | undefined>()
  const [targetUrl, setTargetUrl] = useState('')
  const [ctaText, setCtaText] = useState('')

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [{ data: adData }, { data: { user } }] = await Promise.all([
        supabase.from('ads').select('*').eq('id', id).single(),
        supabase.auth.getUser(),
      ])

      if (adData) {
        const a = adData as unknown as Ad
        setAd(a)
        setTitle(a.title)
        setDescription(a.description ?? '')
        setMobileImageUrl(a.mobile_image_url ?? undefined)
        setDesktopImageUrl(a.desktop_image_url ?? undefined)
        setTargetUrl(a.target_url)
        setCtaText(a.cta_text)
      }

      if (user) {
        const { data: advData } = await supabase
          .from('advertisers')
          .select('id')
          .eq('user_id', user.id)
          .single()
        if (advData) setAdvertiserId(advData.id)
      }

      setLoading(false)
    }

    load()
  }, [id])

  const canEdit = ad && (ad.status === 'draft' || ad.status === 'rejected')
  const needsPayment = ad?.payment_status === 'pending' && ad?.status === 'draft'
  const isPaid = ad?.payment_status === 'paid'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!mobileImageUrl) { setError('La imagen móvil es obligatoria.'); return }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('ads')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        mobile_image_url: mobileImageUrl,
        desktop_image_url: desktopImageUrl ?? null,
        target_url: targetUrl.trim(),
        cta_text: ctaText.trim() || 'Ver más',
      })
      .eq('id', id)

    if (updateError) {
      setError('Error al guardar. Intentá de nuevo.')
      setSaving(false)
      return
    }

    setSaving(false)
    router.refresh()
  }

  async function handlePay() {
    setPaying(true)
    setError('')

    const res = await fetch('/api/ads/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: id }),
    })
    const { url, error: checkoutErr } = await res.json()

    if (!url || checkoutErr) {
      setError('Error al conectar con Mercado Pago. Intentá de nuevo.')
      setPaying(false)
      return
    }

    window.location.href = url
  }

  if (loading) {
    return <div className="p-4 text-center text-calm-400 text-sm pt-20">Cargando...</div>
  }
  if (!ad) {
    return <div className="p-4 text-center text-calm-400 text-sm pt-20">Anuncio no encontrado.</div>
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-calm-800">Anuncio</h1>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${AD_STATUS_COLORS[ad.status]}`}>
          {AD_STATUS_LABELS[ad.status]}
        </span>
      </div>

      {/* Success banner */}
      {justPaid && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3">
          <CheckCircle size={20} className="text-green-500 shrink-0" />
          <div>
            <p className="font-bold text-green-800 text-sm">Pago recibido</p>
            <p className="text-xs text-green-700 mt-0.5">
              Tu anuncio está en revisión y se activará en las próximas 24 hs.
            </p>
          </div>
        </div>
      )}

      {/* Checkout error */}
      {checkoutError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="font-bold text-red-700 text-sm">Error al iniciar el pago</p>
          <p className="text-xs text-red-600 mt-0.5">
            El anuncio fue guardado. Podés reintentar el pago abajo.
          </p>
        </div>
      )}

      {/* Stats for active/paid ads */}
      {isPaid && (
        <div className="bg-calm-50 border border-calm-200 rounded-2xl p-4 flex items-center gap-4">
          <Eye size={20} className="text-calm-500" />
          <div>
            <p className="text-2xl font-extrabold text-calm-700">{ad.current_impressions}</p>
            <p className="text-xs text-calm-400 font-semibold">impresiones</p>
          </div>
          {ad.ends_at && (
            <div className="ml-auto text-right">
              <p className="text-xs text-calm-400 font-semibold">Vence</p>
              <p className="text-sm font-bold text-calm-700">
                {new Date(ad.ends_at).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment CTA for unpaid drafts */}
      {needsPayment && (
        <div className="bg-calm-500 rounded-3xl p-5 text-white space-y-3">
          <div className="flex items-center gap-3">
            <CreditCard size={24} className="text-calm-200" />
            <div>
              <p className="font-extrabold">Falta el pago</p>
              <p className="text-calm-200 text-xs">
                Duración: {ad.duration_days} días · Total: ${(ad.total_price ?? 0).toLocaleString('es-AR')} ARS
              </p>
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full bg-white text-calm-700 font-extrabold py-3 rounded-2xl text-sm hover:bg-calm-50 transition-colors disabled:opacity-60"
          >
            {paying
              ? 'Redirigiendo...'
              : `Pagar $${(ad.total_price ?? 0).toLocaleString('es-AR')} ARS con Mercado Pago`}
          </button>
        </div>
      )}

      {/* Creative services CTA */}
      <Link
        href={`/anuncios/${id}/creatividad`}
        className="flex items-center gap-4 bg-gradient-to-r from-calm-600 to-calm-500 rounded-3xl p-5 text-white"
      >
        <Sparkles size={28} className="text-calm-200 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm">¿Necesitás ayuda con el diseño?</p>
          <p className="text-calm-200 text-xs mt-0.5">
            Solicitá tu creatividad profesional — 7 planes disponibles desde $5.000 ARS
          </p>
        </div>
        <span className="text-calm-200 text-lg shrink-0">→</span>
      </Link>

      {/* Image preview (read-only if not editable) */}
      <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
        <h2 className="font-extrabold text-calm-700">Imágenes</h2>

        {advertiserId ? (
          <>
            <AdImageUpload
              label="Imagen móvil (slider)"
              slot="mobile"
              requiredWidth={MOBILE_SPEC.width}
              requiredHeight={MOBILE_SPEC.height}
              maxSizeMB={MOBILE_SPEC.maxMB}
              advertiserId={advertiserId}
              value={mobileImageUrl}
              onChange={canEdit ? setMobileImageUrl : () => {}}
            />
            <AdImageUpload
              label="Imagen web/desktop"
              slot="desktop"
              requiredWidth={DESKTOP_SPEC.width}
              requiredHeight={DESKTOP_SPEC.height}
              maxSizeMB={DESKTOP_SPEC.maxMB}
              advertiserId={advertiserId}
              value={desktopImageUrl}
              onChange={canEdit ? setDesktopImageUrl : () => {}}
            />
          </>
        ) : (
          <div className="text-center py-4 text-calm-400 text-sm">Cargando...</div>
        )}
      </section>

      {/* Edit form — only for draft/rejected */}
      {canEdit && (
        <form onSubmit={handleSave} className="space-y-5">
          <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
            <h2 className="font-extrabold text-calm-700">Contenido</h2>
            <div>
              <Input
                id="title"
                label="Título"
                value={title}
                onChange={e => setTitle(e.target.value.slice(0, 60))}
                required
              />
              <p className="text-xs text-calm-400 mt-1">{title.length}/60</p>
            </div>
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
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      )}

      {!canEdit && !needsPayment && (
        <div className="bg-calm-50 border border-calm-200 rounded-2xl p-4 text-center text-sm text-calm-500">
          {ad.status === 'pending_review'
            ? 'Tu anuncio está en revisión. No se puede editar hasta que sea procesado.'
            : ad.status === 'active'
            ? 'El anuncio está activo. Para hacer cambios, contactá a soporte.'
            : null}
        </div>
      )}
    </div>
  )
}
