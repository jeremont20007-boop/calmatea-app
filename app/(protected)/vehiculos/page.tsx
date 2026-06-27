import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Search } from 'lucide-react'
import { PLATFORM_LABELS, SCHEDULE_LABELS, VEHICLE_TYPE_LABELS, type Vehicle } from '@/types'
import { AdBanner } from '@/components/ui/AdBanner'

export default async function VehiculosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  const isPremium = profile?.plan === 'premium'

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('id, make, model, year, color, city, revenue_split, platforms, schedule, status, description, vehicle_type, neuquen_only')
    .eq('status', 'disponible')
    .order('created_at', { ascending: false })

  const list = (vehicles ?? []) as unknown as Vehicle[]

  return (
    <div className="flex flex-col">
      <TopBar title="Buscar vehículos" showBack backHref="/dashboard" />

      <div className="p-4 space-y-4">
        {/* Search hint */}
        <div className="bg-calm-100 rounded-2xl px-4 py-3 flex items-center gap-3 text-calm-500">
          <Search size={18} />
          <span className="text-sm font-semibold">
            {list.length} vehículo{list.length !== 1 ? 's' : ''} disponible{list.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Ad: free users see it on every load; premium only once per 6 hs (client-side) */}
        {!isPremium && <AdBanner isPremium={false} />}

        {list.length === 0 && !error && (
          <div className="text-center py-16 space-y-3">
            <div className="text-6xl">🚗</div>
            <p className="font-extrabold text-calm-700 text-lg">No hay vehículos disponibles</p>
            <p className="text-calm-400 text-sm">Vuelve pronto, nuevos vehículos se publican a diario</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-calm-400 text-sm">
            <p>Error cargando vehículos. Intenta de nuevo.</p>
          </div>
        )}

        <div className="space-y-4">
          {list.map(v => (
            <Link key={v.id} href={`/vehiculos/${v.id}`}>
              <Card className="hover:border-calm-400 hover:shadow-md transition-all active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-calm-800 text-lg">
                      {v.make} {v.model}
                    </p>
                    <p className="text-calm-500 text-sm font-semibold">{v.year} · {v.color}</p>
                    <p className="text-calm-400 text-sm mt-1">📍 {v.city}</p>

                    {/* Type + platforms */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {v.vehicle_type && v.vehicle_type !== 'plataforma' && (
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                          v.vehicle_type === 'remis'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {VEHICLE_TYPE_LABELS[v.vehicle_type]}
                        </span>
                      )}
                      {v.neuquen_only && (
                        <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                          Solo Neuquén
                        </span>
                      )}
                      {(v.platforms || []).map(p => (
                        <span key={p} className="text-xs font-bold bg-calm-100 text-calm-700 px-2.5 py-1 rounded-full">
                          {PLATFORM_LABELS[p] || p}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-calm-400 mt-2 font-semibold">
                      🕐 {SCHEDULE_LABELS[v.schedule] || v.schedule}
                    </p>
                  </div>

                  {/* Revenue split highlight */}
                  <div className="text-right shrink-0 bg-forest/10 rounded-2xl px-3 py-2">
                    <p className="text-3xl font-extrabold text-forest">{v.revenue_split}%</p>
                    <p className="text-xs text-forest/70 font-semibold">para ti</p>
                  </div>
                </div>

                {v.description && (
                  <p className="text-sm text-calm-500 mt-3 line-clamp-2 border-t border-calm-100 pt-3">
                    {v.description}
                  </p>
                )}

                <div className="mt-3 text-right">
                  <span className="text-xs font-bold text-calm-400 bg-calm-50 px-3 py-1.5 rounded-xl">
                    Ver detalles →
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
