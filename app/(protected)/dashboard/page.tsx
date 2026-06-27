import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Plus, Search, Bell, Car, TrendingUp } from 'lucide-react'
import { PLATFORM_LABELS, SCHEDULE_LABELS, type Vehicle, type Application } from '@/types'
import { AdBanner } from '@/components/ui/AdBanner'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, city, plan')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const firstName = profile.full_name?.split(' ')[0] || 'Bienvenido'
  const isPropietario = profile.role === 'propietario'

  if (isPropietario) {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, year, status, city, revenue_split, platforms, schedule')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(3)

    const { count: pendingCount } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .in('vehicle_id', (vehicles ?? []).map(v => v.id))
      .eq('status', 'pendiente')

    return <PropietarioDashboard
      firstName={firstName}
      vehicles={(vehicles ?? []) as unknown as Vehicle[]}
      pendingCount={pendingCount ?? 0}
      isPremium={profile.plan === 'premium'}
    />
  }

  const { data: availableVehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year, city, revenue_split, platforms, schedule, status')
    .eq('status', 'disponible')
    .order('created_at', { ascending: false })
    .limit(4)

  const { data: myApplications } = await supabase
    .from('applications')
    .select('id, status, vehicle_id, vehicle:vehicles(make, model, year, city, revenue_split)')
    .eq('driver_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(3)

  return <ConductorDashboard
    firstName={firstName}
    vehicles={(availableVehicles ?? []) as unknown as Vehicle[]}
    applications={(myApplications ?? []) as unknown as Application[]}
    isPremium={profile.plan === 'premium'}
  />
}

function PropietarioDashboard({
  firstName,
  vehicles,
  pendingCount,
  isPremium,
}: {
  firstName: string
  vehicles: Vehicle[]
  pendingCount: number
  isPremium: boolean
}) {
  return (
    <div className="flex flex-col">
      <TopBar title="VehiLink 🚗" />
      <div className="p-4 space-y-5">
        <div className="bg-gradient-to-br from-calm-500 to-calm-700 rounded-3xl p-5 text-white">
          <p className="text-calm-200 font-semibold text-sm">Hola propietario,</p>
          <h2 className="text-2xl font-extrabold">{firstName} 👋</h2>
          <p className="text-calm-200 text-sm mt-1">Gestiona tus vehículos y conductores</p>
        </div>

        <AdBanner isPremium={isPremium} />

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center py-4">
            <p className="text-3xl font-extrabold text-calm-500">{vehicles.length}</p>
            <p className="text-xs text-calm-500 font-semibold mt-1">Vehículos publicados</p>
          </Card>
          <Link href="/solicitudes">
            <Card className={`text-center py-4 ${pendingCount > 0 ? 'border-sunshine bg-sunshine/5' : ''}`}>
              <div className="flex items-center justify-center gap-1">
                <p className="text-3xl font-extrabold text-calm-500">{pendingCount}</p>
                {pendingCount > 0 && <Bell size={18} className="text-warning" />}
              </div>
              <p className="text-xs text-calm-500 font-semibold mt-1">Solicitudes pendientes</p>
            </Card>
          </Link>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/vehiculos/nuevo">
            <Card className="bg-calm-500 border-0 text-white hover:bg-calm-600 transition-colors">
              <div className="flex flex-col items-center gap-2 py-2">
                <Plus size={28} />
                <p className="font-extrabold text-sm">Publicar vehículo</p>
              </div>
            </Card>
          </Link>
          <Link href="/solicitudes">
            <Card className="bg-calm-50 border-calm-200 hover:border-calm-400 transition-colors">
              <div className="flex flex-col items-center gap-2 py-2 text-calm-600">
                <Bell size={28} />
                <p className="font-extrabold text-sm">Ver solicitudes</p>
              </div>
            </Card>
          </Link>
        </div>

        {/* My vehicles */}
        {vehicles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-base font-extrabold text-calm-700">Mis vehículos</h3>
              <Link href="/mis-vehiculos" className="text-xs text-calm-500 font-semibold hover:underline">Ver todos →</Link>
            </div>
            <div className="space-y-3">
              {vehicles.map(v => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        )}

        {vehicles.length === 0 && (
          <Card className="text-center py-8 border-dashed border-2 border-calm-200">
            <Car size={40} className="text-calm-300 mx-auto mb-3" />
            <p className="font-extrabold text-calm-600">Aún no tienes vehículos publicados</p>
            <p className="text-sm text-calm-400 mt-1">Publica tu primer vehículo para empezar</p>
            <Link href="/vehiculos/nuevo" className="inline-block mt-4 bg-calm-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-calm-600 transition-colors">
              + Publicar vehículo
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}

function ConductorDashboard({
  firstName,
  vehicles,
  applications,
  isPremium,
}: {
  firstName: string
  vehicles: Vehicle[]
  applications: Application[]
  isPremium: boolean
}) {
  return (
    <div className="flex flex-col">
      <TopBar title="VehiLink 🚗" />
      <div className="p-4 space-y-5">
        <div className="bg-gradient-to-br from-calm-500 to-calm-700 rounded-3xl p-5 text-white">
          <p className="text-calm-200 font-semibold text-sm">Hola conductor,</p>
          <h2 className="text-2xl font-extrabold">{firstName} 👋</h2>
          <p className="text-calm-200 text-sm mt-1">Encuentra tu próximo vehículo</p>
        </div>

        <AdBanner isPremium={isPremium} />

        {/* CTA */}
        <Link href="/vehiculos">
          <Card className="bg-gradient-to-r from-forest/10 to-calm-100 border-forest/20 hover:border-forest/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-forest/20 flex items-center justify-center">
                <Search size={24} className="text-forest" />
              </div>
              <div>
                <p className="font-extrabold text-calm-800">Buscar vehículos disponibles</p>
                <p className="text-sm text-calm-500">{vehicles.length > 0 ? `${vehicles.length}+ opciones cerca de ti` : 'Encuentra el auto ideal'}</p>
              </div>
              <TrendingUp size={20} className="text-calm-300 ml-auto" />
            </div>
          </Card>
        </Link>

        {/* Featured vehicles */}
        {vehicles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-base font-extrabold text-calm-700">Vehículos disponibles</h3>
              <Link href="/vehiculos" className="text-xs text-calm-500 font-semibold hover:underline">Ver todos →</Link>
            </div>
            <div className="space-y-3">
              {vehicles.map(v => (
                <Link key={v.id} href={`/vehiculos/${v.id}`}>
                  <VehicleCard vehicle={v} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* My applications */}
        {applications.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-base font-extrabold text-calm-700">Mis solicitudes</h3>
              <Link href="/solicitudes" className="text-xs text-calm-500 font-semibold hover:underline">Ver todas →</Link>
            </div>
            <div className="space-y-2">
              {applications.map(app => (
                <ApplicationRow key={app.id} application={app} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const statusColors = {
    disponible: 'bg-green-100 text-green-700',
    ocupado: 'bg-gray-100 text-gray-600',
    pausado: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <Card className="hover:border-calm-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-extrabold text-calm-800 text-base">
              {vehicle.make} {vehicle.model} {vehicle.year}
            </p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[vehicle.status]}`}>
              {vehicle.status === 'disponible' ? 'Disponible' : vehicle.status === 'ocupado' ? 'Ocupado' : 'Pausado'}
            </span>
          </div>
          <p className="text-sm text-calm-500 mt-0.5">📍 {vehicle.city}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {(vehicle.platforms || []).slice(0, 3).map(p => (
              <span key={p} className="text-xs font-bold bg-calm-100 text-calm-700 px-2 py-0.5 rounded-full">
                {PLATFORM_LABELS[p] || p}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-extrabold text-forest">{vehicle.revenue_split}%</p>
          <p className="text-xs text-calm-400 font-semibold">para ti</p>
        </div>
      </div>
      {vehicle.schedule && (
        <p className="text-xs text-calm-400 mt-2 font-semibold">
          🕐 {SCHEDULE_LABELS[vehicle.schedule]}
        </p>
      )}
    </Card>
  )
}

function ApplicationRow({ application }: { application: Application }) {
  const statusStyles: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aceptada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-600',
    retirada: 'bg-gray-100 text-gray-500',
  }

  const vehicle = application.vehicle as unknown as Vehicle

  return (
    <Card className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-calm-800 text-sm truncate">
            {vehicle?.make} {vehicle?.model} {vehicle?.year}
          </p>
          <p className="text-xs text-calm-400">{vehicle?.city}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${statusStyles[application.status] || 'bg-gray-100 text-gray-500'}`}>
          {application.status === 'pendiente' ? 'Pendiente' :
           application.status === 'aceptada' ? 'Aceptada' :
           application.status === 'rechazada' ? 'Rechazada' : 'Retirada'}
        </span>
      </div>
    </Card>
  )
}
