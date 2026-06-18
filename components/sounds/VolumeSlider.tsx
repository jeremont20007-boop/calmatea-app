'use client'

import { Volume1, Volume2, VolumeX } from 'lucide-react'

interface VolumeSliderProps {
  volume: number
  onChange: (v: number) => void
}

export function VolumeSlider({ volume, onChange }: VolumeSliderProps) {
  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-calm-100">
      <Icon size={20} className="text-calm-400 shrink-0" />
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-2 accent-calm-400 cursor-pointer"
        aria-label="Volumen"
      />
      <span className="text-sm font-bold text-calm-600 w-8 text-right">
        {Math.round(volume * 100)}%
      </span>
    </div>
  )
}
