import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Music, Zap, ListChecks, BarChart2, Crown } from 'lucide-react'

const QUICK_ACTIONS = [
  { href: '/sounds', label: 'Sonidos', emoji: '🎵', bg: 'bg-calm-100', color: 'text-calm-600', icon: Music },
  { href: '/emergency', label: 'Calmarme Ahora', emoji: '⚡', bg: 'bg-coral/10', color: 'text-coral', icon: Zap, big: true },
  { href: '/routines', label: 'Rutinas', emoji: '📋', bg: 'bg-forest/10', color: 'text-forest', icon: ListChecks },
  { href: '/parents', label: 'Panel Padres', emoji: '📊', bg: 'bg-lavender/20', color: 'text-purple-600', icon: BarChart2 },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, favorite_sound')
    .eq('user_id', user!.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] || 'Bienvenido'
  const isPremium = profile?.plan === 'premium'

  return (
    <div className="flex flex-col">
      <TopBar title="CalmaTEA 🌊" />

      <div className="p-4 space-y-5">
        {/* Greeting */}
        <div className="bg-gradient-to-br from-calm-400 to-calm-500 rounded-3xl p-5 text-white">
          <p className="text-calm-100 font-semibold text-sm">Hola,</p>
          <h2 className="text-2xl font-extrabold">{firstName} 👋</h2>
          <p className="text-calm-100 text-sm mt-1">¿Cómo estás hoy?</p>
        </div>

        {/* Premium Banner */}
        {!isPremium && (
          <Link href="/subscription">
            <Card className="bg-gradient-to-r from-sunshine/40 to-coral/20 border-sunshine/50 hover:border-sunshine">
              <div className="flex items-center gap-3">
                <Crown size={28} className="text-amber-500 shrink-0" />
                <div>
                  <p className="font-extrabold text-calm-800">Desbloquea Premium</p>
                  <p className="text-sm text-calm-600">Bosque, Ruido Marrón, Rutinas completas y más</p>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-base font-extrabold text-calm-700 mb-3 px-1">Acceso rápido</h3>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ href, label, emoji, bg, color, big }) => (
              <Link key={href} href={href} className={big ? 'col-span-2' : ''}>
                <Card className={`${bg} border-0 ${big ? 'py-6' : 'py-5'} hover:scale-[1.02] transition-transform`}>
                  <div className={`flex ${big ? 'items-center gap-4' : 'flex-col items-start gap-2'}`}>
                    <span className={`text-4xl leading-none ${big ? '' : 'mb-1'}`}>{emoji}</span>
                    <p className={`font-extrabold ${color} ${big ? 'text-xl' : 'text-base'}`}>{label}</p>
                    {big && <p className="text-calm-500 text-sm ml-auto">Toca aquí →</p>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Emotion quick log */}
        <div>
          <h3 className="text-base font-extrabold text-calm-700 mb-3 px-1">¿Cómo se siente ahora?</h3>
          <EmotionQuickLog childId={user!.id} />
        </div>
      </div>
    </div>
  )
}

function EmotionQuickLog({ childId }: { childId: string }) {
  const emotions = [
    { emoji: '😌', label: 'Tranquilo', value: 'calm' },
    { emoji: '😊', label: 'Feliz', value: 'happy' },
    { emoji: '😰', label: 'Ansioso', value: 'anxious' },
    { emoji: '😢', label: 'Triste', value: 'sad' },
    { emoji: '😠', label: 'Enojado', value: 'angry' },
    { emoji: '😴', label: 'Cansado', value: 'tired' },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {emotions.map(e => (
        <Link key={e.value} href={`/dashboard/log-emotion?emotion=${e.value}`}>
          <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-2xl border-2 border-calm-100 hover:border-calm-300 transition-all cursor-pointer active:scale-95">
            <span className="text-3xl">{e.emoji}</span>
            <span className="text-xs font-bold text-calm-600">{e.label}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
