'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSound, setCurrentSound] = useState<string | null>(null)
  const [volume, setVolumeState] = useState(0.7)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const play = useCallback(async (url: string, soundId: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(url)
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio

    try {
      await audio.play()
      setIsPlaying(true)
      setCurrentSound(soundId)
      startTimeRef.current = Date.now()
    } catch (err) {
      console.error('Audio play error:', err)
    }
  }, [volume])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const resume = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.play()
      setIsPlaying(true)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
      setIsPlaying(false)
      setCurrentSound(null)
    }
    const elapsed = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0
    startTimeRef.current = null
    return elapsed
  }, [])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
    if (audioRef.current) {
      audioRef.current.volume = v
    }
  }, [])

  return { isPlaying, currentSound, volume, play, pause, resume, stop, setVolume }
}
