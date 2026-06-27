import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Plus, Users, FileText } from 'lucide-react'
import { PLATFORM_LABELS, SCHEDULE_LABELS, STATUS_LABELS, type Vehicle } from '@/types'
import { VehicleStatusToggle } from './VehicleStatusToggle'

export default async function MisVehiculosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'propietario') redirect('/dashboard')

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year, color, city, revenue_split, platforms, schedule, status, description, license_plate')
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: false })

  const list = (vehicles ?? []) as unknown as Vehicle[]

  // Fetch application counts per vehicle
  const vehicleIds = list.map(v => v.id)
  const appCounts: Record<string, number> = {}

  if (vehicleIds.length > 0) {
    const { data: apps } = await supabase
      .from('applications')
      .select('vehicle_id, status')
      .in('vehicle_id', vehicleIds)
      .eq('status', 'pendiente')

    for (const app of apps ?? []) {
      appCounts[app.vehicle_id] = (appCounts[app.vehicle_id] || 0) + 1
    }
  }

  return (
    <div className="flex flex-col">
      <TopBar
        title="Mis vehículos"
        showBack
        backHref="/dashboard"
        rightAction={
          <Link href="/vehiculos/nuevo" className="flex items-center justify-center w-10 h-10 rounded-xl bg-calm-500 text-white hover:bg-calm-600 transition-colors">
            <Plus size={20} />
          </Link>
        }
      />

      <div className="p-4 space-y-4">
        {list.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl">🚗</div>
            <p className="font-extrabold text-calm-700 text-lg">Aún no tienes vehículos publicados</p>
            <p className="text-calm-400 text-sm">Publica tu primer vehículo para empezar a recibir solicitudes</p>
            <Link
              href="/vehiculos/nuevo"
              className="inline-flex items-center gap-2 bg-calm-500 text-white font-bold px-6 py-3 rounded-2xl hover:bg-calm-600 transition-colors"
            >
              <Plus size={18} />
              Publicar primer vehículo
            </Link>
          </div>
        )}

        {list.map(v => {
          const pendingApps = appCounts[v.id] || 0
          return (
            <Card key={v.id}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-calm-800 text-lg">
                      {v.make} {v.model} {v.year}
                    </h3>
                    <p className="text-calm-500 text-sm">{v.color} · {v.license_plate}</p>
                    <p className="text-calm-400 text-sm">📍 {v.city}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-extrabold text-forest">{v.revenue_split}%</p>
                    <p className="text-xs text-calm-400 font-semibold">conductor</p>
                  </div>
                </div>

                {/* Platforms */}
                <div className="flex flex-wrap gap-1">
                  {(v.platforms || []).map(p => (
                    <span key={p} className="text-xs font-bold bg-calm-100 text-calm-700 px-2.5 py-1 rounded-full">
                      {PLATFORM_LABELS[p] || p}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-calm-400 font-semibold">
                  🕐 {SCHEDULE_LABELS[v.schedule]}
                </p>

                {/* Actions row */}
                <div className="flex items-center gap-3 pt-2 border-t border-calm-100">
                  <VehicleStatusToggle vehicleId={v.id} currentStatus={v.status} />

                  <Link
                    href={`/solicitudes?vehiculo=${v.id}`}
                    className="flex items-center gap-1.5 text-sm font-bold text-calm-600 hover:text-calm-800 transition-colors relative"
                  >
                    <Users size={16} />
                    Solicitudes
                    {pendingApps > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-warning rounded-full text-white text-xs flex items-center justify-center font-extrabold">
                        {pendingApps}
                      </span>
                    )}
                  </Link>

                  <Link
                    href={`/mis-vehiculos/documentos/${v.id}`}
                    className="flex items-center gap-1.5 text-sm font-bold text-calm-600 hover:text-calm-800 transition-colors"
                  >
                    <FileText size={16} />
                    Documentos
                  </Link>
                </div>
              </div>
            </Card>
          )
        })}

        {list.length > 0 && (
          <Link href="/vehiculos/nuevo" className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-calm-300 text-calm-500 font-bold hover:border-calm-500 hover:text-calm-600 transition-colors">
            <Plus size={18} />
            Publicar otro vehículo
          </Link>
        )}
      </div>
    </div>
  )
}
