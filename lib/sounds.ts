import type { Sound } from '@/types'

export const SOUNDS: Sound[] = [
  {
    id: 'rain',
    name: 'Lluvia',
    category: 'rain',
    file_url: '/sounds/rain.mp3',
    emoji: '🌧️',
    is_premium: false,
    color: '#6BA3BE',
  },
  {
    id: 'ocean',
    name: 'Mar',
    category: 'ocean',
    file_url: '/sounds/ocean.mp3',
    emoji: '🌊',
    is_premium: false,
    color: '#4A90D9',
  },
  {
    id: 'white_noise',
    name: 'Ruido Blanco',
    category: 'white_noise',
    file_url: '/sounds/white-noise.mp3',
    emoji: '☁️',
    is_premium: false,
    color: '#B0C4DE',
  },
  {
    id: 'brown_noise',
    name: 'Ruido Marrón',
    category: 'brown_noise',
    file_url: '/sounds/brown-noise.mp3',
    emoji: '🤎',
    is_premium: true,
    color: '#8B6F47',
  },
  {
    id: 'forest',
    name: 'Bosque',
    category: 'forest',
    file_url: '/sounds/forest.mp3',
    emoji: '🌿',
    is_premium: true,
    color: '#4A7C59',
  },
]

export function getSoundById(id: string): Sound | undefined {
  return SOUNDS.find(s => s.id === id)
}
