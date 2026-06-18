'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { startSound, stopSound, setVolume as engineSetVolume, type SoundType } from '@/lib/audioEngine'

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSound, setCurrentSound] = useState<string | null>(null)
  const [volume, setVolumeState] = useState(0.7)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    return () => { stopSound() }
  }, [])

  const play = useCallback(async (_url: string, soundId: string) => {
    await startSound(soundId as SoundType, volume)
    setIsPlaying(true)
    setCurrentSound(soundId)
    startTimeRef.current = Date.now()
  }, [volume])

  const pause = useCallback(() => {
    stopSound()
    setIsPlaying(false)
  }, [])

  const resume = useCallback(async () => {
    if (currentSound) {
      await startSound(currentSound as SoundType, volume)
      setIsPlaying(true)
    }
  }, [currentSound, volume])

  const stop = useCallback((): number => {
    stopSound()
    setIsPlaying(false)
    setCurrentSound(null)
    const elapsed = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0
    startTimeRef.current = null
    return elapsed
  }, [])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
    engineSetVolume(v)
  }, [])

  return { isPlaying, currentSound, volume, play, pause, resume, stop, setVolume }
}
