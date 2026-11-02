'use client'

import { useState, useEffect } from 'react'
import { X, Megaphone } from 'lucide-react'
import { getImageProps } from 'next/image'
import { canOptimizeImage } from '@/lib/images'
import type { PublicAd as AdData } from '@/lib/ads'

const PREMIUM_COOLDOWN_MS = 6 * 60 * 60 * 1000
const LS_KEY = 'vl_ad_ts'

export function AdBanner({
  isPremium = false,
  initialAd,
}: {
  isPremium?: boolean
  /** Ad already picked on the server. When provided (even as null) no client fetch is made. */
  initialAd?: AdData | null
}) {
  const [ad, setAd] = useState<AdData | null>(initialAd ?? null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (initialAd !== undefined) return

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
  }, [isPremium, initialAd])

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
          className="p-1.5 -m-1.5 text-white/70 hover:text-white transition-colors"
          aria-label="Cerrar anuncio"
        >
          <X size={12} />
        </button>
      </div>

      {/* Responsive image (optimized + resized by next/image for each screen) */}
      {hasImage && (
        <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="block">
          <AdPicture ad={ad} />
        </a>
      )}

      {/* Content row */}
      <div className={`flex gap-3 items-start p-3 ${hasImage ? '' : 'pt-8 bg-gradient-to-br from-calm-50 to-white'}`}>
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

function AdPicture({ ad }: { ad: AdData }) {
  const mobileSrc = ad.mobile_image_url ?? ad.desktop_image_url ?? ''
  const common = { alt: ad.title, sizes: '(min-width: 640px) 512px, 100vw', loading: 'eager' as const }

  const desktop = ad.desktop_image_url
    ? getImageProps({
        ...common,
        src: ad.desktop_image_url,
        width: 1200,
        height: 400,
        unoptimized: !canOptimizeImage(ad.desktop_image_url),
      }).props.srcSet ?? ad.desktop_image_url
    : null

  const { props } = getImageProps({
    ...common,
    src: mobileSrc,
    width: ad.mobile_image_url ? 750 : 1200,
    height: ad.mobile_image_url ? 300 : 400,
    unoptimized: !canOptimizeImage(mobileSrc),
  })

  return (
    <picture>
      {desktop && <source media="(min-width: 640px)" srcSet={desktop} sizes={common.sizes} />}
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img
        {...props}
        className="w-full object-cover"
        style={{ aspectRatio: ad.mobile_image_url ? '750/300' : '1200/400', height: 'auto' }}
      />
    </picture>
  )
}
