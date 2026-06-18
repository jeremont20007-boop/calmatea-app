'use client'

import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RoutineStepCard } from '@/components/routines/RoutineStepCard'
import { useProfile } from '@/lib/hooks/useProfile'
import { useToast } from '@/components/ui/Toast'
import { ROUTINES } from '@/lib/routines'
import { createClient } from '@/lib/supabase/client'
import { Lock, RotateCcw, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Routine, RoutineType } from '@/types'

export default function RoutinesPage() {
  const { profile } = useProfile()
  const { toast } = useToast()
  const isPremium = profile?.plan === 'premium'
  const [selected, setSelected] = useState<Routine | null>(null)
  const [completed, setCompleted] = useState<number[]>([])
  const [done, setDone] = useState(false)

  function openRoutine(routine: Routine) {
    setSelected(routine)
    setCompleted([])
    setDone(false)
  }

  function toggleStep(stepIndex: number) {
    setCompleted(prev =>
      prev.includes(stepIndex)
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    )
  }

  async function finishRoutine() {
    if (!profile || !selected) return
    const supabase = createClient()
    toast('¡Rutina completada! 🎉', 'success')
    await supabase.from('routine_progress').insert({
      child_id: profile.id,
      routine_type: selected.type as RoutineType,
      completed_steps: completed,
      completed_at: new Date().toISOString(),
    })
    setDone(true)
  }

  if (selected) {
    const allDone = completed.length === selected.steps.length

    if (done) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-forest/10 to-calm-50">
          <div className="text-center space-y-5">
            <div className="text-8xl">🎉</div>
            <h2 className="text-3xl font-extrabold text-calm-800">¡Lo lograste!</h2>
            <p className="text-calm-500 font-semibold">Completaste la rutina de {selected.name}</p>
            <Button size="xl" className="w-full" onClick={() => setSelected(null)}>
              Ver más rutinas
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col min-h-screen max-w-lg mx-auto">
        <main className="flex-1 pb-24">
          <TopBar title={selected.name} showBack rightAction={
            <button onClick={() => { setCompleted([]); setDone(false) }} className="p-2 text-calm-400 hover:text-calm-600">
              <RotateCcw size={20} />
            </button>
          } />

          <div className="p-4 space-y-3">
            {/* Progress bar */}
            <div className="bg-calm-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-forest rounded-full transition-all duration-500"
                style={{ width: `${(completed.length / selected.steps.length) * 100}%` }}
              />
            </div>
            <p className="text-sm font-bold text-calm-500 text-right">
              {completed.length}/{selected.steps.length} pasos
            </p>

            {selected.steps.map((step, i) => (
              <RoutineStepCard
                key={step.id}
                step={step}
                completed={completed.includes(i)}
                active={i === completed.length}
                onToggle={() => toggleStep(i)}
              />
            ))}

            {allDone && (
              <Button size="xl" className="w-full mt-4 bg-forest hover:bg-forest/90" onClick={finishRoutine}>
                <CheckCircle2 className="mr-2" size={24} />
                ¡Terminar rutina!
              </Button>
            )}
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <main className="flex-1 pb-24">
        <TopBar title="Rutinas 📋" />

        <div className="p-4 space-y-3">
          <p className="text-calm-500 text-sm font-semibold px-1">
            Elige una rutina y sigue los pasos con tu peque.
          </p>

          {ROUTINES.map(routine => {
            const locked = routine.is_premium && !isPremium
            const emoji = {
              morning: '🌅',
              school: '🏫',
              bath: '🚿',
              sleep: '🌙',
            }[routine.type]

            return (
              <Card
                key={routine.id}
                onClick={locked ? undefined : () => openRoutine(routine)}
                className={cn('flex items-center gap-4', locked && 'opacity-60')}
              >
                <span className="text-4xl">{emoji}</span>
                <div className="flex-1">
                  <p className="font-extrabold text-calm-800">{routine.name}</p>
                  <p className="text-sm text-calm-400">{routine.steps.length} pasos</p>
                </div>
                {locked ? (
                  <div className="flex items-center gap-1 text-amber-600 bg-sunshine/30 px-3 py-1 rounded-full">
                    <Lock size={14} />
                    <span className="text-xs font-bold">Premium</span>
                  </div>
                ) : (
                  <span className="text-calm-300 text-xl">→</span>
                )}
              </Card>
            )
          })}

          {!isPremium && (
            <div className="bg-sunshine/20 rounded-2xl p-4 text-center border border-sunshine/40 mt-4">
              <p className="font-bold text-calm-700">🔒 Baño y Dormir son Premium</p>
              <a href="/subscription" className="text-sm text-calm-500 underline mt-1 block">
                Ver planes →
              </a>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
