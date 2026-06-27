import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { NuevoVehiculoForm } from './NuevoVehiculoForm'

export default async function NuevoVehiculoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, plan')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'propietario') redirect('/dashboard')

  if (profile.plan !== 'premium') {
    const { count } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', profile.id)

    if ((count ?? 0) >= 1) {
      return (
        <div className="flex flex-col min-h-screen">
          <TopBar title="Publicar vehículo" showBack backHref="/mis-vehiculos" />
          <div className="p-6 space-y-5 max-w-lg mx-auto w-full">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 text-center space-y-4">
              <Lock size={40} className="text-amber-500 mx-auto" />
              <h2 className="text-xl font-extrabold text-amber-800">Límite del plan gratuito</h2>
              <p className="text-sm text-amber-700">
                Con el plan gratuito podés publicar <strong>1 vehículo</strong>. Para publicar más,
                eliminá el vehículo existente o pasate a Premium.
              </p>
              <div className="space-y-3 pt-2">
                <Link
                  href="/subscription"
                  className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 rounded-2xl text-sm transition-colors"
                >
                  Ver Plan Premium →
                </Link>
                <Link
                  href="/mis-vehiculos"
                  className="block w-full border-2 border-amber-300 text-amber-700 font-bold py-3 rounded-2xl text-sm hover:bg-amber-100 transition-colors"
                >
                  Gestionar mis vehículos
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  return <NuevoVehiculoForm />
}
