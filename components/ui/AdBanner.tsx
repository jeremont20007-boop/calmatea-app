'use client'

import { useState, useEffect } from 'react'
import { X, Megaphone } from 'lucide-react'

interface AdData {
  id: string
  title: string
  description?: string
  mobile_image_url?: string
  desktop_image_url?: string
  target_url: string
  cta_text: string
  advertiser_name?: string
}

const PREMIUM_COOLDOWN_MS = 6 * 60 * 60 * 1000
const LS_KEY = 'vl_ad_ts'

export function AdBanner({ isPremium = false }: { isPremium?: boolean }) {
  const [ad, setAd] = useState<AdData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isPremium) {
      const last = localStorage.getItem(LS_KEY)
      if (last && Date.now() - parseInt(last) < PREMIUM_COOLDOWN_MS) return
    }

    fetch('/api/ads/random')
      .then(r => r.json())
      .then(data => {
        if (data.ad) {
          setAd(data.ad)
          if (isPremium) localStorage.setItem(LS_KEY, String(Date.now()))
        }
      })
      .catch(() => {})
  }, [isPremium])

  if (!ad || dismissed) return null

  const hasImage = ad.mobile_image_url || ad.desktop_image_url

  return (
    <div className="relative rounded-2xl overflow-hidden border border-calm-200 bg-white">
      {/* Label + close */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
        <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">
          Publicidad
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Cerrar anuncio"
        >
          <X size={12} />
        </button>
      </div>

      {/* Responsive image */}
      {hasImage && (
        <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="block">
          <picture>
            {ad.desktop_image_url && (
              <source media="(min-width: 640px)" srcSet={ad.desktop_image_url} />
            )}
            <img
              src={ad.mobile_image_url ?? ad.desktop_image_url ?? ''}
              alt={ad.title}
              className="w-full object-cover"
              style={{ aspectRatio: ad.mobile_image_url ? '750/300' : '1200/400' }}
            />
          </picture>
        </a>
      )}

      {/* Content row */}
      <div className={`flex gap-3 items-start p-3 ${hasImage ? '' : 'bg-gradient-to-br from-calm-50 to-white'}`}>
        {!hasImage && (
          <div className="w-12 h-12 rounded-xl bg-calm-100 flex items-center justify-center shrink-0">
            <Megaphone size={20} className="text-calm-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-calm-800 text-sm leading-snug">{ad.title}</p>
          {ad.description && (
            <p className="text-xs text-calm-500 mt-0.5 line-clamp-2">{ad.description}</p>
          )}
          {ad.advertiser_name && (
            <p className="text-[10px] text-calm-400 font-semibold mt-0.5">{ad.advertiser_name}</p>
          )}
        </div>

        <a
          href={ad.target_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-calm-500 hover:bg-calm-600 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          {ad.cta_text} →
        </a>
      </div>
    </div>
  )
}
