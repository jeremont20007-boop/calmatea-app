import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { type Vehicle } from '@/types'
import { EditVehicleForm } from './EditVehicleForm'

export const metadata: Metadata = {
  title: 'Editar vehículo',
  description: 'Actualizá los datos, la disponibilidad y el porcentaje ofrecido de tu vehículo publicado en VehiLink.',
}

export default async function EditarVehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'propietario') redirect('/dashboard')

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (!vehicle || vehicle.owner_id !== profile.id) notFound()

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        title="Editar vehículo"
        showBack
        backHref="/mis-vehiculos"
      />
      <EditVehicleForm vehicle={vehicle as unknown as Vehicle} />
    </div>
  )
}
