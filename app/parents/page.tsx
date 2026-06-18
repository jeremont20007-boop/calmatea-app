import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmotionBadge } from '@/components/parents/EmotionBadge'
import { formatDate, formatDuration } from '@/lib/utils'
import { BarChart2, Clock, Music, Heart } from 'lucide-react'
import Link from 'next/link'
import type { EmotionType } from '@/types'

export default async function ParentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, plan')
    .eq('user_id', user!.id)
    .single()

  const [emotionsRes, sessionsRes, routinesRes] = await Promise.all([
    supabase
      .from('emotion_logs')
      .select('*')
      .eq('child_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('sound_sessions')
      .select('*')
      .eq('child_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('routine_progress')
      .select('*')
      .eq('child_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const emotions = emotionsRes.data || []
  const sessions = sessionsRes.data || []
  const routines = routinesRes.data || []

  const totalTime = sessions.reduce((acc, s) => acc + s.duration_seconds, 0)

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <main className="flex-1 pb-24">
        <TopBar title="Panel de Padres 📊" />

        <div className="p-4 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center p-3">
              <div className="text-2xl mb-1">❤️</div>
              <p className="text-xl font-extrabold text-calm-800">{emotions.length}</p>
              <p className="text-xs font-semibold text-calm-400">Emociones</p>
            </Card>
            <Card className="text-center p-3">
              <div className="text-2xl mb-1">🎵</div>
              <p className="text-xl font-extrabold text-calm-800">{sessions.length}</p>
              <p className="text-xs font-semibold text-calm-400">Sesiones</p>
            </Card>
            <Card className="text-center p-3">
              <div className="text-2xl mb-1">⏱️</div>
              <p className="text-xl font-extrabold text-calm-800">{Math.round(totalTime / 60)}m</p>
              <p className="text-xs font-semibold text-calm-400">Total</p>
            </Card>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/parents/history">
              <Card className="flex items-center gap-3 hover:bg-calm-50">
                <BarChart2 size={20} className="text-calm-400" />
                <span className="font-bold text-calm-700 text-sm">Historial completo</span>
              </Card>
            </Link>
            <Link href="/parents/reports">
              <Card className="flex items-center gap-3 hover:bg-calm-50">
                <Heart size={20} className="text-coral" />
                <span className="font-bold text-calm-700 text-sm">Reportes</span>
              </Card>
            </Link>
          </div>

          {/* Recent emotions */}
          <Card>
            <CardTitle className="mb-3 flex items-center gap-2">
              <span>😊</span> Últimas emociones
            </CardTitle>
            {emotions.length === 0 ? (
              <p className="text-calm-400 text-sm">Aún no hay emociones registradas</p>
            ) : (
              <div className="space-y-2">
                {emotions.map((e) => (
                  <div key={e.id} className="flex items-center justify-between">
                    <EmotionBadge emotion={e.emotion as EmotionType} />
                    <span className="text-xs text-calm-400">{formatDate(e.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent sound sessions */}
          <Card>
            <CardTitle className="mb-3 flex items-center gap-2">
              <Music size={18} /> Últimas sesiones de sonido
            </CardTitle>
            {sessions.length === 0 ? (
              <p className="text-calm-400 text-sm">Aún no hay sesiones registradas</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-1 border-b border-calm-50 last:border-0">
                    <div>
                      <p className="font-semibold text-calm-800 capitalize text-sm">
                        {s.sound_category.replace('_', ' ')}
                        {s.triggered_by === 'emergency' && (
                          <span className="ml-2 text-xs bg-coral/20 text-coral px-1.5 py-0.5 rounded-full">Emergencia</span>
                        )}
                      </p>
                      <p className="text-xs text-calm-400">{formatDate(s.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1 text-calm-400">
                      <Clock size={14} />
                      <span className="text-sm font-semibold">{formatDuration(s.duration_seconds)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Routine completions */}
          {routines.length > 0 && (
            <Card>
              <CardTitle className="mb-3">📋 Rutinas recientes</CardTitle>
              <div className="space-y-2">
                {routines.map(r => (
                  <div key={r.id} className="flex items-center justify-between">
                    <span className="font-semibold text-calm-800 capitalize text-sm">{r.routine_type}</span>
                    <span className="text-xs text-calm-400">{formatDate(r.created_at)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Link href="/subscription">
            <Card className={`${profile?.plan === 'premium' ? 'bg-forest/10 border-forest/30' : 'bg-sunshine/20 border-sunshine/50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-calm-800">
                    {profile?.plan === 'premium' ? '⭐ Plan Premium activo' : '✨ Plan Gratuito'}
                  </p>
                  <p className="text-sm text-calm-500 mt-0.5">
                    {profile?.plan === 'premium' ? 'Acceso completo' : 'Mejora para más funciones'}
                  </p>
                </div>
                <span className="text-calm-300 text-xl">→</span>
              </div>
            </Card>
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
