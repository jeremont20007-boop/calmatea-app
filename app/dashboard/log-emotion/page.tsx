'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { TopBar } from '@/components/layout/TopBar'
import type { EmotionType } from '@/types'

const EMOTION_DETAILS: Record<string, { emoji: string; label: string; color: string }> = {
  calm: { emoji: '😌', label: 'Tranquilo', color: '#6BA3BE' },
  happy: { emoji: '😊', label: 'Feliz', color: '#FFD166' },
  anxious: { emoji: '😰', label: 'Ansioso', color: '#EF8C6E' },
  sad: { emoji: '😢', label: 'Triste', color: '#B8A9D9' },
  angry: { emoji: '😠', label: 'Enojado', color: '#EF4444' },
  tired: { emoji: '😴', label: 'Cansado', color: '#9CA3AF' },
}

function LogEmotionContent() {
  const params = useSearchParams()
  const router = useRouter()
  const emotion = params.get('emotion') as EmotionType
  const detail = EMOTION_DETAILS[emotion]
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  if (!detail) {
    router.push('/dashboard')
    return null
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      await supabase.from('emotion_logs').insert({
        child_id: profile.id,
        emotion,
        note: note || null,
      })
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar title="Registrar emoción" showBack backHref="/dashboard" />
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-lg"
          style={{ backgroundColor: `${detail.color}20`, border: `4px solid ${detail.color}` }}
        >
          {detail.emoji}
        </div>
        <h2 className="text-2xl font-extrabold text-calm-800">{detail.label}</h2>

        <div className="w-full max-w-sm">
          <label className="block text-sm font-semibold text-calm-700 mb-2">Nota (opcional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="¿Qué pasó?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 bg-white text-calm-800 font-medium focus:outline-none focus:border-calm-400 resize-none"
          />
        </div>

        <div className="w-full max-w-sm space-y-3">
          <Button size="xl" onClick={save} disabled={saving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar emoción'}
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={() => router.push('/dashboard')}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function LogEmotionPage() {
  return (
    <Suspense>
      <LogEmotionContent />
    </Suspense>
  )
}
