'use client'

import { cn } from '@/lib/utils'
import type { Sound } from '@/types'
import { Lock, Pause, Play } from 'lucide-react'

interface SoundCardProps {
  sound: Sound
  isPlaying: boolean
  isPremium: boolean
  onPlay: () => void
  onPause: () => void
  isFavorite?: boolean
  onFavorite?: () => void
}

export function SoundCard({ sound, isPlaying, isPremium, onPlay, onPause, isFavorite, onFavorite }: SoundCardProps) {
  const locked = sound.is_premium && !isPremium

  function handleClick() {
    if (locked) return
    if (isPlaying) onPause()
    else onPlay()
  }

  return (
    <button
      onClick={handleClick}
      disabled={locked}
      className={cn(
        'relative flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all duration-300 w-full touch-target',
        isPlaying
          ? 'border-current shadow-lg scale-105'
          : 'border-calm-100 bg-white hover:border-current hover:shadow-md',
        locked && 'opacity-60 cursor-not-allowed',
      )}
      style={{
        backgroundColor: isPlaying ? `${sound.color}20` : undefined,
        borderColor: isPlaying ? sound.color : undefined,
        color: sound.color,
      }}
    >
      {sound.is_premium && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold bg-sunshine text-calm-800 px-2 py-0.5 rounded-full">
          {locked ? <Lock size={10} /> : null}
          Premium
        </span>
      )}
      <span className="text-5xl leading-none">{sound.emoji}</span>
      <div className="text-center">
        <p className="font-extrabold text-calm-800 text-base">{sound.name}</p>
      </div>
      <div
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full transition-all',
          isPlaying ? 'bg-current text-white' : 'bg-calm-100'
        )}
        style={{ backgroundColor: isPlaying ? sound.color : undefined }}
      >
        {isPlaying
          ? <Pause size={20} className="text-white" />
          : locked
          ? <Lock size={18} className="text-calm-400" />
          : <Play size={20} className="text-calm-500" />
        }
      </div>
      {isPlaying && (
        <div className="flex gap-1 items-end h-5">
          {[1, 2, 3, 4, 3].map((h, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full animate-pulse"
              style={{
                height: `${h * 5}px`,
                backgroundColor: sound.color,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}
    </button>
  )
}
