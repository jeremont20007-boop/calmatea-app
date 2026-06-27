import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { PLATFORM_LABELS, SCHEDULE_LABELS, VEHICLE_TYPE_LABELS, DAYS_OF_WEEK, APPLICATION_STATUS_LABELS, type Vehicle, type Application } from '@/types'
import { ApplyButton } from './ApplyButton'

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*, owner:profiles!owner_id(id, full_name, city)')
    .eq('id', id)
    .single()

  if (!vehicle) notFound()

  const v = vehicle as unknown as Vehicle

  let existingApplication: Application | null = null
  if (profile?.role === 'conductor') {
    const { data: app } = await supabase
      .from('applications')
      .select('id, status, message')
      .eq('vehicle_id', id)
      .eq('driver_id', profile.id)
      .single()
    existingApplication = (app as unknown as Application) ?? null
  }

  const isOwner = profile?.role === 'propietario' && v.owner_id === profile?.id

  return (
    <div className="flex flex-col">
      <TopBar title="Detalle del vehículo" showBack backHref="/vehiculos" />

      <div className="p-4 space-y-4">
        {/* Main info card */}
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-calm-800">
                {v.make} {v.model}
              </h1>
              <p className="text-calm-500 font-semibold">{v.year} · {v.color}</p>
              <p className="text-calm-400 text-sm mt-1">📍 {v.city}</p>
            </div>
            <div className="bg-forest/10 rounded-2xl px-4 py-3 text-center shrink-0">
              <p className="text-4xl font-extrabold text-forest">{v.revenue_split}%</p>
              <p className="text-xs text-forest/70 font-bold">para el conductor</p>
            </div>
          </div>

          <div className={`inline-flex mt-3 text-xs font-bold px-3 py-1 rounded-full ${
            v.status === 'disponible' ? 'bg-green-100 text-green-700' :
            v.status === 'ocupado' ? 'bg-gray-100 text-gray-600' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {v.status === 'disponible' ? '● Disponible' : v.status === 'ocupado' ? '● Ocupado' : '● Pausado'}
          </div>
        </Card>

        {/* Platforms */}
        <Card>
          <h2 className="font-extrabold text-calm-700 mb-3">Plataformas activas</h2>
          <div className="flex flex-wrap gap-2">
            {(v.platforms || []).map(p => (
              <span key={p} className="font-bold bg-calm-100 text-calm-700 px-3 py-1.5 rounded-xl text-sm">
                {PLATFORM_LABELS[p] || p}
              </span>
            ))}
          </div>
        </Card>

        {/* Vehicle type & classification */}
        <Card>
          <h2 className="font-extrabold text-calm-700 mb-3">Tipo de vehículo</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-calm-100">
              <span className="text-calm-500 text-sm font-semibold">Clasificación</span>
              <span className="font-bold text-calm-800">{VEHICLE_TYPE_LABELS[v.vehicle_type]}</span>
            </div>
            {v.is_in_remis_base && (
              <div className="flex justify-between items-center py-2 border-b border-calm-100">
                <span className="text-calm-500 text-sm font-semibold">Base de remis</span>
                <span className="font-bold text-calm-800">{v.remis_base_name || 'Sí'}</span>
              </div>
            )}
            {v.neuquen_only && (
              <div className="flex justify-between items-center py-2">
                <span className="text-calm-500 text-sm font-semibold">Habilitación</span>
                <span className="font-bold text-calm-800">Solo Neuquén</span>
              </div>
            )}
          </div>
        </Card>

        {/* Schedule & Terms */}
        <Card>
          <h2 className="font-extrabold text-calm-700 mb-3">Condiciones</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-calm-100">
              <span className="text-calm-500 text-sm font-semibold">Horario disponible</span>
              <span className="font-bold text-calm-800">{SCHEDULE_LABELS[v.schedule]}</span>
            </div>
            {v.available_days && v.available_days.length > 0 && (
              <div className="py-2 border-b border-calm-100">
                <p className="text-calm-500 text-sm font-semibold mb-1.5">Días para alquilar</p>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS_OF_WEEK.map(d => (
                    <span
                      key={d.value}
                      className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        v.available_days!.includes(d.value)
                          ? 'bg-calm-500 text-white'
                          : 'bg-calm-50 text-calm-300'
                      }`}
                    >
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {v.available_hours && (
              <div className="flex justify-between items-center py-2 border-b border-calm-100">
                <span className="text-calm-500 text-sm font-semibold">Horario de alquiler</span>
                <span className="font-bold text-calm-800">{v.available_hours}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-calm-100">
              <span className="text-calm-500 text-sm font-semibold">Porcentaje para conductor</span>
              <span className="font-extrabold text-forest text-lg">{v.revenue_split}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-calm-500 text-sm font-semibold">Porcentaje para propietario</span>
              <span className="font-bold text-calm-700">{100 - v.revenue_split}%</span>
            </div>
          </div>
        </Card>

        {/* Description */}
        {v.description && (
          <Card>
            <h2 className="font-extrabold text-calm-700 mb-2">Descripción</h2>
            <p className="text-calm-600 text-sm leading-relaxed">{v.description}</p>
          </Card>
        )}

        {/* Owner info (anonymized) */}
        <Card>
          <h2 className="font-extrabold text-calm-700 mb-3">Propietario</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-calm-100 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <p className="font-bold text-calm-800">
                {isOwner ? (v.owner as unknown as { full_name: string })?.full_name : 'Propietario verificado'}
              </p>
              <p className="text-sm text-calm-400">{v.city}</p>
            </div>
          </div>
        </Card>

        {/* Application section */}
        {!isOwner && profile?.role === 'conductor' && (
          <div className="pb-4">
            {existingApplication ? (
              <Card className={`text-center ${
                existingApplication.status === 'aceptada' ? 'bg-green-50 border-green-200' :
                existingApplication.status === 'rechazada' ? 'bg-red-50 border-red-200' :
                'bg-yellow-50 border-yellow-200'
              }`}>
                <p className="font-extrabold text-calm-800 text-lg mb-1">Tu solicitud</p>
                <p className={`font-bold text-xl ${
                  existingApplication.status === 'aceptada' ? 'text-green-600' :
                  existingApplication.status === 'rechazada' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {APPLICATION_STATUS_LABELS[existingApplication.status]}
                </p>
                {existingApplication.status === 'aceptada' && (
                  <p className="text-sm text-green-600 mt-2">
                    ¡El propietario aceptó tu solicitud! Revisa tus datos de contacto en tu perfil y coordina los detalles.
                  </p>
                )}
              </Card>
            ) : v.status === 'disponible' ? (
              <ApplyButton vehicleId={id} driverId={profile.id} ownerSplit={v.revenue_split} />
            ) : (
              <Card className="text-center bg-gray-50 border-gray-200">
                <p className="font-bold text-calm-500">Este vehículo no está disponible actualmente</p>
              </Card>
            )}
          </div>
        )}

        {isOwner && (
          <Card className="bg-calm-50 border-calm-200">
            <p className="text-sm font-bold text-calm-600 text-center">Este es tu vehículo</p>
            <div className="mt-2 text-center">
              <a href="/mis-vehiculos" className="text-calm-500 font-bold text-sm hover:underline">
                Gestionar en Mis Vehículos →
              </a>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
