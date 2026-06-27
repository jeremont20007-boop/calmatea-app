import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import type { Profile, Rating } from '@/types'
import { RatingForm } from './RatingForm'

export default async function CalificarPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ vehicleId?: string }>
}) {
  const { userId } = await params
  const { vehicleId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: me } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!me || me.id === userId) notFound()

  const { data: target } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single()

  if (!target) notFound()

  const t = target as unknown as Profile

  // Eligibility check: verify a connection exists via accepted applications
  let eligible = false

  if (me.role === 'propietario' && t.role === 'conductor') {
    // propietario rating conductor: conductor has accepted app on one of my vehicles
    const query = supabase
      .from('applications')
      .select('id')
      .eq('driver_id', userId)
      .eq('status', 'aceptada')
    if (vehicleId) query.eq('vehicle_id', vehicleId)
    else {
      // check any of my vehicles
      const { data: myVehicles } = await supabase
        .from('vehicles').select('id').eq('owner_id', me.id)
      const ids = (myVehicles ?? []).map(v => v.id)
      if (ids.length > 0) query.in('vehicle_id', ids)
    }
    const { data } = await query.limit(1)
    eligible = (data?.length ?? 0) > 0

  } else if (me.role === 'conductor' && t.role === 'propietario') {
    // conductor rating propietario: I have accepted app on one of their vehicles
    const query = supabase
      .from('applications')
      .select('id, vehicle:vehicles!vehicle_id(owner_id)')
      .eq('driver_id', me.id)
      .eq('status', 'aceptada')
    if (vehicleId) query.eq('vehicle_id', vehicleId)
    const { data } = await query
    eligible = (data ?? []).some(
      a => (a.vehicle as unknown as { owner_id: string })?.owner_id === userId
    )

  } else if (me.role === 'conductor' && t.role === 'conductor') {
    // co-conductor: both have accepted apps on the same vehicle
    const { data } = await supabase
      .from('applications')
      .select('vehicle_id')
      .eq('driver_id', me.id)
      .eq('status', 'aceptada')

    const myVehicleIds = (data ?? []).map(a => a.vehicle_id)

    if (myVehicleIds.length > 0) {
      const { data: coApps } = await supabase
        .from('applications')
        .select('vehicle_id')
        .eq('driver_id', userId)
        .eq('status', 'aceptada')
        .in('vehicle_id', myVehicleIds)
      eligible = (coApps?.length ?? 0) > 0
    }
  }

  if (!eligible) {
    return (
      <div className="flex flex-col">
        <TopBar title="Calificar" showBack backHref="/solicitudes" />
        <div className="p-4">
          <Card className="text-center py-8">
            <p className="text-4xl mb-3">🔒</p>
            <p className="font-extrabold text-calm-700">No podés calificar a este usuario</p>
            <p className="text-sm text-calm-400 mt-1">
              Solo podés calificar a usuarios con los que hayas tenido una relación de trabajo aceptada.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  // Check if already rated
  const ratingQuery = supabase
    .from('ratings')
    .select('id, rating, comment')
    .eq('from_user_id', me.id)
    .eq('to_user_id', userId)
  if (vehicleId) ratingQuery.eq('vehicle_id', vehicleId)
  const { data: existing } = await ratingQuery.maybeSingle()
  const existingRating = existing as unknown as Rating | null

  return (
    <div className="flex flex-col">
      <TopBar title="Calificar usuario" showBack backHref="/solicitudes" />

      <div className="p-4 space-y-5 pb-8">
        {/* Target user info */}
        <Card className="bg-calm-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-calm-200 flex items-center justify-center text-2xl shrink-0">
              {t.role === 'conductor' ? '🧑‍💼' : '🚗'}
            </div>
            <div>
              <p className="font-extrabold text-calm-800">{t.full_name}</p>
              <p className="text-xs text-calm-500 capitalize">{t.role}</p>
            </div>
          </div>
        </Card>

        <Card>
          <RatingForm
            fromUserId={me.id}
            toUserId={userId}
            toUserName={t.full_name}
            vehicleId={vehicleId ?? ''}
            existingRating={existingRating?.rating}
            existingComment={existingRating?.comment}
            existingRatingId={existingRating?.id}
          />
        </Card>

        <p className="text-xs text-calm-400 text-center px-4">
          Las calificaciones son públicas y visibles en el perfil del usuario.
          Solo podés calificar una vez por vehículo.
        </p>
      </div>
    </div>
  )
}
