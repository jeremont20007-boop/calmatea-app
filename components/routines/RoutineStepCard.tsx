'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { RoutineStep } from '@/types'

interface RoutineStepCardProps {
  step: RoutineStep
  completed: boolean
  active: boolean
  onToggle: () => void
}

export function RoutineStepCard({ step, completed, active, onToggle }: RoutineStepCardProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-4 w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left touch-target',
        completed
          ? 'bg-forest/10 border-forest/30'
          : active
          ? 'bg-calm-50 border-calm-400 shadow-md'
          : 'bg-white border-calm-100 hover:border-calm-200'
      )}
    >
      <div className="text-4xl leading-none shrink-0">{step.pictogram}</div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-bold text-base',
          completed ? 'text-forest line-through opacity-70' : 'text-calm-800'
        )}>
          {step.title}
        </p>
        {step.duration_minutes && step.duration_minutes > 0 && (
          <p className="text-sm text-calm-400 mt-0.5">{step.duration_minutes} minutos</p>
        )}
      </div>
      <div className={cn(
        'flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 transition-all',
        completed
          ? 'bg-forest border-forest'
          : active
          ? 'border-calm-400 bg-calm-50'
          : 'border-calm-200 bg-white'
      )}>
        {completed && <Check size={20} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  )
}
