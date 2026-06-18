import { cn } from '@/lib/utils'
import type { EmotionType } from '@/types'

const EMOTIONS: Record<EmotionType, { emoji: string; label: string; color: string }> = {
  calm: { emoji: '😌', label: 'Tranquilo', color: 'bg-calm-100 text-calm-700' },
  happy: { emoji: '😊', label: 'Feliz', color: 'bg-sunshine/30 text-amber-700' },
  anxious: { emoji: '😰', label: 'Ansioso', color: 'bg-coral/20 text-red-700' },
  sad: { emoji: '😢', label: 'Triste', color: 'bg-lavender/30 text-purple-700' },
  angry: { emoji: '😠', label: 'Enojado', color: 'bg-red-100 text-red-800' },
  tired: { emoji: '😴', label: 'Cansado', color: 'bg-gray-100 text-gray-600' },
}

export function EmotionBadge({ emotion }: { emotion: EmotionType }) {
  const { emoji, label, color } = EMOTIONS[emotion]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold', color)}>
      {emoji} {label}
    </span>
  )
}

export { EMOTIONS }
