'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AdImageUpload } from '@/components/ui/AdImageUpload'
import {
  AD_DURATION_OPTIONS, AD_PRICE_PER_DAY_ARS, calcAdPrice,
} from '@/types'
import { Info, CreditCard } from 'lucide-react'

// Mobile slider: 750×300 px (ratio 2.5:1)
const MOBILE_SPEC = { width: 750, height: 300, maxMB: 2 }
// Desktop banner: 1200×400 px (ratio 3:1)
const DESKTOP_SPEC = { width: 1200, height: 400, maxMB: 3 }

export default function NuevoAnuncioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [advertiserId, setAdvertiserId] = useState<string | null>(null)

  // Content
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mobileImageUrl, setMobileImageUrl] = useState<string | undefined>()
  const [desktopImageUrl, setDesktopImageUrl] = useState<string | undefined>()
  const [targetUrl, setTargetUrl] = useState('')
  const [ctaText, setCtaText] = useState('Ver más')

  // Duration & pricing
  const [durationDays, setDurationDays] = useState(30)

  const totalPrice = calcAdPrice(durationDays)
  const selectedOpt = AD_DURATION_OPTIONS.find(o => o.days === durationDays)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('advertisers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (data) setAdvertiserId(data.id)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!mobileImageUrl) {
      setError('La imagen móvil (slider) es obligatoria.')
      return
    }
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

    // Save ad as draft first, then go to checkout
    const { data: newAd, error: insertError } = await supabase
      .from('ads')
      .insert({
        advertiser_id: advertiser.id,
        title: title.trim(),
        description: description.trim() || null,
        mobile_image_url: mobileImageUrl,
        desktop_image_url: desktopImageUrl ?? null,
        target_url: targetUrl.trim(),
        cta_text: ctaText.trim() || 'Ver más',
        duration_days: durationDays,
        total_price: totalPrice,
        status: 'draft',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (insertError || !newAd) {
      setError('Error al guardar el anuncio. Intentá de nuevo.')
      setLoading(false)
      return
    }

    // Create MercadoPago checkout
    const checkoutRes = await fetch('/api/ads/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: newAd.id }),
    })

    const { url, error: checkoutError } = await checkoutRes.json()

    if (!url || checkoutError) {
      // Payment failed — redirect to the ad detail page so user can retry
      router.push(`/anuncios/${newAd.id}?checkout_error=1`)
      return
    }

    window.location.href = url
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-extrabold text-calm-800">Crear anuncio</h1>
        <p className="text-sm text-calm-500 mt-0.5">
          Elegí el formato, cargá tus imágenes y seleccioná la duración.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Imágenes ── */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-6">
          <div>
            <h2 className="font-extrabold text-calm-700 text-lg mb-0.5">📸 Imágenes del anuncio</h2>
            <p className="text-xs text-calm-400">
              Las imágenes aparecen según el dispositivo del usuario.
            </p>
          </div>

          {advertiserId ? (
            <>
              <AdImageUpload
                label="Imagen móvil (obligatoria)"
                slot="mobile"
                requiredWidth={MOBILE_SPEC.width}
                requiredHeight={MOBILE_SPEC.height}
                maxSizeMB={MOBILE_SPEC.maxMB}
                advertiserId={advertiserId}
                value={mobileImageUrl}
                onChange={setMobileImageUrl}
              />

              <AdImageUpload
                label="Imagen web/desktop (recomendada)"
                slot="desktop"
                requiredWidth={DESKTOP_SPEC.width}
                requiredHeight={DESKTOP_SPEC.height}
                maxSizeMB={DESKTOP_SPEC.maxMB}
                advertiserId={advertiserId}
                value={desktopImageUrl}
                onChange={setDesktopImageUrl}
              />
            </>
          ) : (
            <div className="text-center py-8 text-calm-400 text-sm">
              <div className="w-6 h-6 border-2 border-calm-300 border-t-calm-600 rounded-full animate-spin mx-auto mb-2" />
              Cargando...
            </div>
          )}

          {/* Format guide */}
          <div className="bg-calm-50 rounded-2xl p-4 space-y-2.5 text-xs">
            <p className="font-extrabold text-calm-700">Especificaciones</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="font-bold text-calm-600">📱 Mobile slider</p>
                <p className="text-calm-500">750 × 300 px (ratio 5:2)</p>
                <p className="text-calm-500">JPG o PNG · máx 2 MB</p>
                <p className="text-calm-400 italic">Se ve en la app mobile</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-calm-600">🖥️ Web banner</p>
                <p className="text-calm-500">1200 × 400 px (ratio 3:1)</p>
                <p className="text-calm-500">JPG o PNG · máx 3 MB</p>
                <p className="text-calm-400 italic">Se ve en pantallas grandes</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Contenido ── */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <h2 className="font-extrabold text-calm-700 text-lg">✏️ Contenido</h2>

          <div>
            <Input
              id="title"
              label="Título del anuncio"
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
              placeholder="Breve descripción de tu oferta..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 bg-white text-calm-800 font-medium placeholder:text-calm-300 focus:outline-none focus:border-calm-400 transition-colors text-sm resize-none"
            />
            <p className="text-xs text-calm-400 mt-1">{description.length}/120 caracteres</p>
          </div>

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

        {/* ── Duración y precio ── */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <h2 className="font-extrabold text-calm-700 text-lg">📅 Duración de la campaña</h2>
          <p className="text-xs text-calm-400">
            Precio base: ${AD_PRICE_PER_DAY_ARS.toLocaleString('es-AR')} ARS / día.
            Mayor duración = mayor descuento.
          </p>

          <div className="space-y-2">
            {AD_DURATION_OPTIONS.map(opt => {
              const price = calcAdPrice(opt.days)
              const active = durationDays === opt.days
              return (
                <label
                  key={opt.days}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    active
                      ? 'border-calm-500 bg-calm-50'
                      : 'border-calm-100 hover:border-calm-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="duration"
                      value={opt.days}
                      checked={active}
                      onChange={() => setDurationDays(opt.days)}
                      className="accent-calm-500"
                    />
                    <div>
                      <p className="font-extrabold text-calm-800 text-sm">{opt.label}</p>
                      {opt.discount > 0 && (
                        <p className="text-xs text-green-600 font-bold">
                          {(opt.discount * 100).toFixed(0)}% de descuento
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-calm-700">
                      ${price.toLocaleString('es-AR')}
                    </p>
                    <p className="text-[10px] text-calm-400">ARS total</p>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Price summary */}
          <div className="bg-calm-500 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-calm-200 text-xs font-semibold">Total a pagar</p>
                <p className="text-3xl font-extrabold">
                  ${totalPrice.toLocaleString('es-AR')}
                </p>
                <p className="text-calm-300 text-xs mt-0.5">
                  ARS · {durationDays} días
                  {selectedOpt?.discount ? ` · ${(selectedOpt.discount * 100).toFixed(0)}% descuento` : ''}
                </p>
              </div>
              <CreditCard size={36} className="text-calm-300" />
            </div>
          </div>
        </section>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            El pago se procesa vía <strong>Mercado Pago</strong>. Una vez confirmado, el anuncio
            entra en revisión y se activa en máx. 24 hs. La campaña empieza a correr desde la
            aprobación.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading || !advertiserId}>
          {loading
            ? 'Procesando...'
            : `Pagar $${totalPrice.toLocaleString('es-AR')} ARS y publicar`}
        </Button>

        <p className="text-center text-xs text-calm-400">
          Pago seguro con Mercado Pago · Los anuncios son revisados antes de publicarse
        </p>
      </form>
    </div>
  )
}
