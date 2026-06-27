'use client'

import { useState, useEffect } from 'react'
import { X, Megaphone } from 'lucide-react'

interface AdData {
  id: string
  title: string
  description?: string
  image_url?: string
  target_url: string
  cta_text: string
  advertiser_name?: string
}

const PREMIUM_COOLDOWN_MS = 6 * 60 * 60 * 1000 // 6 hours
const LS_KEY = 'vl_ad_ts'

export function AdBanner({ isPremium = false }: { isPremium?: boolean }) {
  const [ad, setAd] = useState<AdData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isPremium) {
      const lastShown = localStorage.getItem(LS_KEY)
      if (lastShown && Date.now() - parseInt(lastShown) < PREMIUM_COOLDOWN_MS) return
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

  return (
    <div className="relative bg-gradient-to-br from-calm-50 to-white border border-calm-200 rounded-2xl p-4 overflow-hidden">
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        <span className="text-[10px] text-calm-300 font-semibold uppercase tracking-widest">
          Publicidad
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-calm-300 hover:text-calm-500 transition-colors"
          aria-label="Cerrar anuncio"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex gap-3 items-start pr-14">
        {ad.image_url ? (
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-14 h-14 rounded-xl object-cover shrink-0 bg-calm-100"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-calm-100 flex items-center justify-center shrink-0">
            <Megaphone size={22} className="text-calm-400" />
          </div>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-extrabold text-calm-800 text-sm leading-snug">{ad.title}</p>
          {ad.description && (
            <p className="text-xs text-calm-500 mt-0.5 line-clamp-2">{ad.description}</p>
          )}
          {ad.advertiser_name && (
            <p className="text-[10px] text-calm-400 font-semibold mt-1">{ad.advertiser_name}</p>
          )}
        </div>
      </div>

      <a
        href={ad.target_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block w-full text-center bg-calm-500 hover:bg-calm-600 text-white font-bold text-xs py-2.5 rounded-xl transition-colors"
      >
        {ad.cta_text} →
      </a>
    </div>
  )
}
