import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card, CardTitle } from '@/components/ui/Card'
import { formatDuration } from '@/lib/utils'
import type { EmotionType, SoundCategory } from '@/types'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const [emotionsRes, sessionsRes, routinesRes] = await Promise.all([
    supabase.from('emotion_logs').select('emotion').eq('child_id', profile?.id),
    supabase.from('sound_sessions').select('sound_category, duration_seconds, triggered_by').eq('child_id', profile?.id),
    supabase.from('routine_progress').select('routine_type, completed_at').eq('child_id', profile?.id),
  ])

  const emotions = emotionsRes.data || []
  const sessions = sessionsRes.data || []
  const routines = routinesRes.data || []

  // Emotion frequency
  const emotionCounts = emotions.reduce<Record<string, number>>((acc, e) => {
    acc[e.emotion] = (acc[e.emotion] || 0) + 1
    return acc
  }, {})

  const emotionEmojis: Record<EmotionType, string> = {
    calm: '😌', happy: '😊', anxious: '😰', sad: '😢', angry: '😠', tired: '😴'
  }

  // Sound usage
  const soundCounts = sessions.reduce<Record<string, { count: number; totalSeconds: number }>>((acc, s) => {
    if (!acc[s.sound_category]) acc[s.sound_category] = { count: 0, totalSeconds: 0 }
    acc[s.sound_category].count++
    acc[s.sound_category].totalSeconds += s.duration_seconds
    return acc
  }, {})

  const totalSeconds = sessions.reduce((acc, s) => acc + s.duration_seconds, 0)
  const emergencyCount = sessions.filter(s => s.triggered_by === 'emergency').length
  const routinesCompleted = routines.filter(r => r.completed_at).length

  const soundEmojis: Record<SoundCategory, string> = {
    rain: '🌧️', ocean: '🌊', white_noise: '☁️', brown_noise: '🤎', forest: '🌿'
  }

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <main className="flex-1 pb-24">
        <TopBar title="Reportes" showBack backHref="/parents" />

        <div className="p-4 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tiempo total de calma', value: formatDuration(totalSeconds), emoji: '⏱️' },
              { label: 'Emergencias activadas', value: emergencyCount, emoji: '⚡' },
              { label: 'Rutinas completadas', value: routinesCompleted, emoji: '✅' },
              { label: 'Emociones registradas', value: emotions.length, emoji: '❤️' },
            ].map(({ label, value, emoji }) => (
              <Card key={label} className="text-center p-4">
                <div className="text-3xl mb-1">{emoji}</div>
                <p className="text-2xl font-extrabold text-calm-800">{value}</p>
                <p className="text-xs font-semibold text-calm-400 mt-0.5">{label}</p>
              </Card>
            ))}
          </div>

          {/* Emotion distribution */}
          <Card>
            <CardTitle className="mb-4">Emociones más frecuentes</CardTitle>
            {Object.keys(emotionCounts).length === 0 ? (
              <p className="text-calm-400 text-sm">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(emotionCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([emotion, count]) => {
                    const pct = Math.round((count / emotions.length) * 100)
                    return (
                      <div key={emotion}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-calm-700">
                            {emotionEmojis[emotion as EmotionType]} {emotion}
                          </span>
                          <span className="text-sm font-bold text-calm-500">{count}x ({pct}%)</span>
                        </div>
                        <div className="bg-calm-100 rounded-full h-2.5">
                          <div
                            className="bg-calm-400 h-2.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </Card>

          {/* Sound usage */}
          <Card>
            <CardTitle className="mb-4">Sonidos más usados</CardTitle>
            {Object.keys(soundCounts).length === 0 ? (
              <p className="text-calm-400 text-sm">Sin sesiones aún</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(soundCounts)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([sound, { count, totalSeconds: ts }]) => (
                    <div key={sound} className="flex items-center justify-between py-2 border-b border-calm-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{soundEmojis[sound as SoundCategory] || '🔊'}</span>
                        <div>
                          <p className="font-bold text-calm-800 capitalize text-sm">{sound.replace('_', ' ')}</p>
                          <p className="text-xs text-calm-400">{count} sesión{count !== 1 ? 'es' : ''}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-calm-600 bg-calm-50 px-3 py-1 rounded-xl">
                        {formatDuration(ts)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
