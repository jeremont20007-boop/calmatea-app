import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { type Application, type Vehicle, type Profile, PLATFORM_LABELS, SCHEDULE_LABELS, DAYS_OF_WEEK } from '@/types'
import { ApplicationActions } from './ApplicationActions'
import { WithdrawButton } from './WithdrawButton'

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  if (profile.role === 'propietario') {
    // Get owner's vehicles first
    const { data: myVehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, year')
      .eq('owner_id', profile.id)

    const vehicleIds = (myVehicles ?? []).map(v => v.id)

    if (vehicleIds.length === 0) {
      return <EmptyState role="propietario" />
    }

    const { data: applications } = await supabase
      .from('applications')
      .select('*, vehicle:vehicles(id, make, model, year, city, revenue_split, platforms), driver:profiles!driver_id(id, full_name, city, phone, license_number, experience_years, bio)')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false })
    // Note: driver_offered_split, driver_available_days, driver_schedule are included via the * selector

    return (
      <PropietarioApplications
        applications={(applications ?? []) as unknown as Application[]}
        vehicles={(myVehicles ?? []) as unknown as Vehicle[]}
      />
    )
  }

  // Conductor view
  const { data: applications } = await supabase
    .from('applications')
    .select('*, vehicle:vehicles(id, make, model, year, city, revenue_split, platforms, schedule)')
    .eq('driver_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <ConductorApplications
      applications={(applications ?? []) as unknown as Application[]}
    />
  )
}

function EmptyState({ role }: { role: 'conductor' | 'propietario' }) {
  return (
    <div className="flex flex-col">
      <TopBar title="Solicitudes" showBack backHref="/dashboard" />
      <div className="text-center py-20 px-6 space-y-3">
        <div className="text-6xl">📋</div>
        <p className="font-extrabold text-calm-700 text-lg">
          {role === 'propietario' ? 'Aún no tienes vehículos publicados' : 'Aún no tienes solicitudes'}
        </p>
        <p className="text-calm-400 text-sm">
          {role === 'propietario'
            ? 'Publica tu primer vehículo para empezar a recibir solicitudes'
            : 'Busca vehículos disponibles y envía tu primera solicitud'}
        </p>
      </div>
    </div>
  )
}

function PropietarioApplications({
  applications,
  vehicles,
}: {
  applications: Application[]
  vehicles: Vehicle[]
}) {
  const pending = applications.filter(a => a.status === 'pendiente')
  const resolved = applications.filter(a => a.status !== 'pendiente')

  return (
    <div className="flex flex-col">
      <TopBar title="Solicitudes recibidas" showBack backHref="/dashboard" />
      <div className="p-4 space-y-5">

        {applications.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="text-6xl">📬</div>
            <p className="font-extrabold text-calm-700">Aún no hay solicitudes</p>
            <p className="text-calm-400 text-sm">Cuando conductores apliquen a tus vehículos, aparecerán aquí</p>
          </div>
        )}

        {pending.length > 0 && (
          <div>
            <h2 className="font-extrabold text-calm-700 mb-3 px-1 flex items-center gap-2">
              Pendientes
              <span className="bg-warning text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                {pending.length}
              </span>
            </h2>
            <div className="space-y-4">
              {pending.map(app => (
                <ApplicationCard key={app.id} application={app} isPropietario showActions />
              ))}
            </div>
          </div>
        )}

        {resolved.length > 0 && (
          <div>
            <h2 className="font-extrabold text-calm-700 mb-3 px-1">Historial</h2>
            <div className="space-y-3">
              {resolved.map(app => (
                <ApplicationCard key={app.id} application={app} isPropietario />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConductorApplications({ applications }: { applications: Application[] }) {
  const pending = applications.filter(a => a.status === 'pendiente')
  const accepted = applications.filter(a => a.status === 'aceptada')
  const other = applications.filter(a => a.status === 'rechazada' || a.status === 'retirada')

  return (
    <div className="flex flex-col">
      <TopBar title="Mis solicitudes" showBack backHref="/dashboard" />
      <div className="p-4 space-y-5">

        {applications.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="text-6xl">📋</div>
            <p className="font-extrabold text-calm-700">Aún no tienes solicitudes</p>
            <p className="text-calm-400 text-sm">Busca vehículos disponibles y aplica al que te interese</p>
            <a href="/vehiculos" className="inline-block bg-calm-500 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-calm-600 transition-colors mt-2">
              Buscar vehículos →
            </a>
          </div>
        )}

        {accepted.length > 0 && (
          <div>
            <h2 className="font-extrabold text-calm-700 mb-3 px-1">✅ Aceptadas</h2>
            <div className="space-y-3">
              {accepted.map(app => (
                <ApplicationCard key={app.id} application={app} isPropietario={false} />
              ))}
            </div>
          </div>
        )}

        {pending.length > 0 && (
          <div>
            <h2 className="font-extrabold text-calm-700 mb-3 px-1">⏳ Pendientes</h2>
            <div className="space-y-3">
              {pending.map(app => (
                <ApplicationCard key={app.id} application={app} isPropietario={false} />
              ))}
            </div>
          </div>
        )}

        {other.length > 0 && (
          <div>
            <h2 className="font-extrabold text-calm-700 mb-3 px-1">Historial</h2>
            <div className="space-y-3">
              {other.map(app => (
                <ApplicationCard key={app.id} application={app} isPropietario={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ApplicationCard({
  application,
  isPropietario,
  showActions = false,
}: {
  application: Application
  isPropietario: boolean
  showActions?: boolean
}) {
  const vehicle = application.vehicle as unknown as Vehicle
  const driver = application.driver as unknown as Profile

  const statusStyles: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aceptada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-600',
    retirada: 'bg-gray-100 text-gray-500',
  }

  const statusLabels: Record<string, string> = {
    pendiente: 'Pendiente',
    aceptada: 'Aceptada',
    rechazada: 'Rechazada',
    retirada: 'Retirada',
  }

  return (
    <Card className={application.status === 'aceptada' ? 'border-green-200 bg-green-50/30' : ''}>
      <div className="space-y-3">
        {/* Vehicle info */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-extrabold text-calm-800">
              {vehicle?.make} {vehicle?.model} {vehicle?.year}
            </p>
            <p className="text-sm text-calm-400">📍 {vehicle?.city}</p>
            {vehicle?.platforms && (
              <div className="flex flex-wrap gap-1 mt-1">
                {vehicle.platforms.slice(0, 3).map(p => (
                  <span key={p} className="text-xs bg-calm-100 text-calm-600 font-bold px-2 py-0.5 rounded-full">
                    {PLATFORM_LABELS[p] || p}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="shrink-0">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusStyles[application.status] || 'bg-gray-100 text-gray-500'}`}>
              {statusLabels[application.status] || application.status}
            </span>
          </div>
        </div>

        {/* Driver info (for owners) */}
        {isPropietario && driver && (
          <div className="bg-calm-50 rounded-2xl p-3 space-y-1.5">
            <p className="font-bold text-calm-800 text-sm">Conductor: {driver.full_name}</p>
            {driver.city && <p className="text-xs text-calm-400">📍 {driver.city}</p>}
            {driver.experience_years && (
              <p className="text-xs text-calm-500 font-semibold">{driver.experience_years} años de experiencia</p>
            )}
            {driver.license_number && (
              <p className="text-xs text-calm-500">Licencia: {driver.license_number}</p>
            )}
            {driver.phone && application.status === 'aceptada' && (
              <p className="text-xs text-calm-600 font-semibold">📞 {driver.phone}</p>
            )}
          </div>
        )}

        {/* Driver's bid & schedule offer */}
        {(application.driver_offered_split || application.driver_schedule) && (
          <div className="bg-calm-50 rounded-2xl p-3 space-y-1.5">
            <p className="text-xs font-extrabold text-calm-600 mb-1">Oferta del conductor</p>
            {application.driver_offered_split && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-calm-500 font-semibold">Porcentaje ofrecido</span>
                <span className="font-extrabold text-forest">{application.driver_offered_split}% para el conductor</span>
              </div>
            )}
            {application.driver_schedule && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-calm-500 font-semibold">Modalidad</span>
                <span className="text-xs font-bold text-calm-800">{SCHEDULE_LABELS[application.driver_schedule]}</span>
              </div>
            )}
            {application.driver_available_days && application.driver_available_days.length > 0 && (
              <div>
                <p className="text-xs text-calm-500 font-semibold mb-1">Días disponibles</p>
                <div className="flex gap-1 flex-wrap">
                  {DAYS_OF_WEEK.map(d => (
                    <span
                      key={d.value}
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${
                        application.driver_available_days!.includes(d.value)
                          ? 'bg-calm-500 text-white'
                          : 'bg-calm-100 text-calm-300'
                      }`}
                    >
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Application message */}
        {application.message && (
          <div className="bg-calm-50 rounded-2xl p-3">
            <p className="text-xs text-calm-500 font-semibold mb-1">Mensaje del conductor:</p>
            <p className="text-sm text-calm-700 leading-relaxed">{application.message}</p>
          </div>
        )}

        {/* Owner response */}
        {application.owner_response && (
          <div className="bg-blue-50 rounded-2xl p-3">
            <p className="text-xs text-blue-500 font-semibold mb-1">Respuesta del propietario:</p>
            <p className="text-sm text-blue-700 leading-relaxed">{application.owner_response}</p>
          </div>
        )}

        {/* Revenue split for conductor view */}
        {!isPropietario && (vehicle?.revenue_split || application.driver_offered_split) && (
          <div className="border-t border-calm-100 pt-2 space-y-1">
            {application.driver_offered_split && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-calm-400 font-semibold">Tu oferta</span>
                <span className="font-extrabold text-calm-700">{application.driver_offered_split}%</span>
              </div>
            )}
            {vehicle?.revenue_split && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-calm-400 font-semibold">Oferta del propietario</span>
                <span className="font-extrabold text-forest">{vehicle.revenue_split}%</span>
              </div>
            )}
          </div>
        )}

        {/* Accept/Reject actions for owner */}
        {showActions && isPropietario && application.status === 'pendiente' && (
          <ApplicationActions applicationId={application.id} />
        )}

        {/* Withdraw for conductor */}
        {!isPropietario && application.status === 'pendiente' && (
          <WithdrawButton applicationId={application.id} />
        )}
      </div>
    </Card>
  )
}
