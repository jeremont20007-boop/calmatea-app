'use client'

import { useState, useCallback } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { SoundCard } from '@/components/sounds/SoundCard'
import { VolumeSlider } from '@/components/sounds/VolumeSlider'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAudio } from '@/lib/hooks/useAudio'
import { useProfile } from '@/lib/hooks/useProfile'
import { useToast } from '@/components/ui/Toast'
import { SOUNDS } from '@/lib/sounds'
import { createClient } from '@/lib/supabase/client'
import { Crown } from 'lucide-react'
import Link from 'next/link'
import type { SoundCategory } from '@/types'

export default function SoundsPage() {
  const { isPlaying, currentSound, volume, play, pause, stop, setVolume } = useAudio()
  const { profile } = useProfile()
  const { toast } = useToast()
  const isPremium = profile?.plan === 'premium'
  const [sessionStart, setSessionStart] = useState<number | null>(null)

  async function logSession(soundId: string, durationSeconds: number) {
    if (!profile || durationSeconds < 3) return
    const supabase = createClient()
    await supabase.from('sound_sessions').insert({
      child_id: profile.id,
      sound_category: soundId as SoundCategory,
      duration_seconds: durationSeconds,
      triggered_by: 'manual',
    })
  }

  const handlePlay = useCallback(async (sound: typeof SOUNDS[0]) => {
    if (sound.is_premium && !isPremium) {
      toast('Este sonido es Premium. ¡Mejora tu plan!', 'info')
      return
    }
    if (currentSound && currentSound !== sound.id) {
      const elapsed = stop()
      await logSession(currentSound, elapsed)
    }
    await play(sound.file_url, sound.id)
    setSessionStart(Date.now())
    toast(`▶ Reproduciendo ${sound.name}`, 'success')
  }, [currentSound, play, stop, isPremium, toast])

  const handlePause = useCallback(async () => {
    if (currentSound && sessionStart) {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000)
      pause()
      await logSession(currentSound, elapsed)
      setSessionStart(null)
    } else {
      pause()
    }
  }, [currentSound, sessionStart, pause])

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <main className="flex-1 pb-24">
        <TopBar title="Sonidos 🎵" />

        <div className="p-4 space-y-4">
          <p className="text-calm-500 text-sm font-semibold px-1">
            Toca un sonido para reproducirlo. Se repite en bucle.
          </p>

          <VolumeSlider volume={volume} onChange={setVolume} />

          <div className="grid grid-cols-2 gap-3">
            {SOUNDS.map(sound => (
              <SoundCard
                key={sound.id}
                sound={sound}
                isPlaying={isPlaying && currentSound === sound.id}
                isPremium={isPremium}
                onPlay={() => handlePlay(sound)}
                onPause={handlePause}
              />
            ))}
          </div>

          {!isPremium && (
            <Link href="/subscription">
              <div className="bg-gradient-to-r from-sunshine/30 to-coral/20 rounded-2xl p-4 flex items-center gap-3 border border-sunshine/40">
                <Crown size={22} className="text-amber-500 shrink-0" />
                <div>
                  <p className="font-bold text-calm-700 text-sm">Bosque y Ruido Marrón son Premium</p>
                  <p className="text-xs text-calm-400 mt-0.5">Ver planes →</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
