'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAudio } from '@/lib/hooks/useAudio'
import { useProfile } from '@/lib/hooks/useProfile'
import { SOUNDS, getSoundById } from '@/lib/sounds'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SoundCategory } from '@/types'

const DEFAULT_SOUND = 'rain'

export default function EmergencyPage() {
  const router = useRouter()
  const { profile } = useProfile()
  const { isPlaying, play, stop } = useAudio()
  const [phase, setPhase] = useState<'idle' | 'active' | 'breathe'>('idle')
  const [breathStep, setBreathStep] = useState<'in' | 'hold' | 'out'>('in')
  const [breathCount, setBreathCount] = useState(0)
  const [showSoundPicker, setShowSoundPicker] = useState(false)
  const [selectedSound, setSelectedSound] = useState<string>(DEFAULT_SOUND)

  useEffect(() => {
    const fav = profile?.favorite_sound || DEFAULT_SOUND
    setSelectedSound(fav)
  }, [profile])

  const startCalm = useCallback(async () => {
    setPhase('active')
    const sound = getSoundById(selectedSound)
    if (sound) {
      const isPremium = profile?.plan === 'premium'
      const canPlay = !sound.is_premium || isPremium
      if (canPlay) {
        await play(sound.file_url, sound.id)
      } else {
        await play(SOUNDS[0].file_url, SOUNDS[0].id)
      }
    }
    startBreathing()
  }, [selectedSound, profile, play])

  function startBreathing() {
    setPhase('breathe')
    setBreathStep('in')
    setBreathCount(0)
  }

  useEffect(() => {
    if (phase !== 'breathe') return
    const steps: { step: 'in' | 'hold' | 'out'; duration: number }[] = [
      { step: 'in', duration: 4000 },
      { step: 'hold', duration: 2000 },
      { step: 'out', duration: 6000 },
    ]
    let i = 0
    function next() {
      const { step, duration } = steps[i % steps.length]
      setBreathStep(step)
      if (step === 'in') setBreathCount(c => c + 1)
      i++
      return setTimeout(next, duration)
    }
    const t = setTimeout(next, 4000)
    return () => clearTimeout(t)
  }, [phase])

  async function handleClose() {
    const elapsed = stop()
    if (profile && elapsed > 3) {
      const supabase = createClient()
      await supabase.from('sound_sessions').insert({
        child_id: profile.id,
        sound_category: selectedSound as SoundCategory,
        duration_seconds: elapsed,
        triggered_by: 'emergency',
      })
    }
    setPhase('idle')
    router.push('/dashboard')
  }

  const BREATHE_LABELS: Record<string, string> = {
    in: '🫁 Inhala...',
    hold: '⏸️ Aguanta...',
    out: '💨 Exhala...',
  }

  if (phase === 'idle') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-calm-50 to-calm-100 p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="text-7xl animate-pulse-calm">🌊</div>
          <h1 className="text-3xl font-extrabold text-calm-800">Calmarme Ahora</h1>
          <p className="text-calm-500 font-semibold">Pulsa el botón y te ayudo a respirar y calmarte</p>

          <Button
            variant="emergency"
            size="xl"
            onClick={startCalm}
            className="w-full rounded-3xl py-8 text-3xl font-extrabold shadow-2xl"
          >
            ⚡ ¡Calmarme!
          </Button>

          <button
            onClick={() => setShowSoundPicker(!showSoundPicker)}
            className="flex items-center gap-2 text-calm-500 text-sm font-semibold mx-auto"
          >
            Sonido: {getSoundById(selectedSound)?.emoji} {getSoundById(selectedSound)?.name}
            <ChevronDown size={16} />
          </button>

          {showSoundPicker && (
            <div className="bg-white rounded-2xl border border-calm-100 shadow-lg overflow-hidden">
              {SOUNDS.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSound(s.id); setShowSoundPicker(false) }}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-calm-50 transition-colors',
                    selectedSound === s.id && 'bg-calm-100 font-bold'
                  )}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-calm-800 font-semibold">{s.name}</span>
                  {s.is_premium && <span className="ml-auto text-xs bg-sunshine/40 text-amber-700 font-bold px-2 py-0.5 rounded-full">Premium</span>}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => router.push('/dashboard')}
            className="text-calm-400 text-sm hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-calm-800 to-calm-900 z-50">
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={24} />
      </button>

      <div className="text-center space-y-8 px-6">
        {/* Breathing circle */}
        <div className="relative flex items-center justify-center">
          <div
            className={cn(
              'w-48 h-48 rounded-full border-4 border-calm-300/50 flex items-center justify-center transition-all duration-1000',
              breathStep === 'in' && 'scale-125 border-calm-200',
              breathStep === 'hold' && 'scale-125 border-sunshine',
              breathStep === 'out' && 'scale-100 border-calm-400',
            )}
            style={{ backgroundColor: 'rgba(107, 163, 190, 0.15)' }}
          >
            <div
              className={cn(
                'w-36 h-36 rounded-full transition-all duration-1000 flex items-center justify-center',
                breathStep === 'in' && 'scale-110',
                breathStep === 'out' && 'scale-90',
              )}
              style={{ backgroundColor: 'rgba(107, 163, 190, 0.3)' }}
            >
              <span className="text-5xl">🌊</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-white/60 text-sm font-semibold mb-2">Respiración {breathCount}</p>
          <p className="text-white text-3xl font-extrabold">
            {BREATHE_LABELS[breathStep]}
          </p>
        </div>

        <p className="text-white/50 text-sm">
          Sigue el círculo con tu respiración
        </p>

        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="bg-white/10 text-white border-0 hover:bg-white/20"
          >
            Listo, ya estoy bien
          </Button>
        </div>
      </div>
    </div>
  )
}
