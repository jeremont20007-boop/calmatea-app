import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card } from '@/components/ui/Card'
import { EmotionBadge } from '@/components/parents/EmotionBadge'
import { formatDate, formatDuration } from '@/lib/utils'
import { Clock } from 'lucide-react'
import type { EmotionType } from '@/types'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const [emotionsRes, sessionsRes] = await Promise.all([
    supabase
      .from('emotion_logs')
      .select('*')
      .eq('child_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('sound_sessions')
      .select('*')
      .eq('child_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const emotions = emotionsRes.data || []
  const sessions = sessionsRes.data || []

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <main className="flex-1 pb-24">
        <TopBar title="Historial completo" showBack backHref="/parents" />

        <div className="p-4 space-y-5">
          {/* Emotions history */}
          <div>
            <h2 className="text-base font-extrabold text-calm-700 mb-3 px-1">😊 Emociones registradas ({emotions.length})</h2>
            {emotions.length === 0 ? (
              <Card><p className="text-calm-400 text-sm">Sin registros aún</p></Card>
            ) : (
              <div className="space-y-2">
                {emotions.map(e => (
                  <Card key={e.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <EmotionBadge emotion={e.emotion as EmotionType} />
                        {e.note && <p className="text-sm text-calm-500 italic">"{e.note}"</p>}
                        {e.sound_played && <p className="text-xs text-calm-400">Sonido: {e.sound_played}</p>}
                      </div>
                      <span className="text-xs text-calm-300 whitespace-nowrap">{formatDate(e.created_at)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sound sessions history */}
          <div>
            <h2 className="text-base font-extrabold text-calm-700 mb-3 px-1">🎵 Sesiones de sonido ({sessions.length})</h2>
            {sessions.length === 0 ? (
              <Card><p className="text-calm-400 text-sm">Sin sesiones aún</p></Card>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <Card key={s.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-calm-800 capitalize">
                          {s.sound_category.replace('_', ' ')}
                          {s.triggered_by === 'emergency' && (
                            <span className="ml-2 text-xs bg-coral/20 text-coral px-2 py-0.5 rounded-full">⚡ Emergencia</span>
                          )}
                        </p>
                        <p className="text-xs text-calm-400 mt-0.5">{formatDate(s.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-calm-500 bg-calm-50 px-3 py-1.5 rounded-xl">
                        <Clock size={14} />
                        <span className="text-sm font-bold">{formatDuration(s.duration_seconds)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
