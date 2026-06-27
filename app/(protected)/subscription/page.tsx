import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { CheckoutButton } from './CheckoutButton'
import { SuccessBanner } from './SuccessBanner'
import { Check, Crown, Lock } from 'lucide-react'

const FREE_FEATURES_CONDUCTOR = [
  'Hasta 3 solicitudes activas simultáneas',
  'Acceso al listado completo de vehículos',
  'Historial de solicitudes',
  'Calificaciones y perfil público',
]

const FREE_FEATURES_PROPIETARIO = [
  '1 vehículo publicado',
  'Recibir solicitudes ilimitadas',
  'Gestión de aplicaciones y documentos',
]

const PREMIUM_FEATURES_CONDUCTOR = [
  'Solicitudes ilimitadas',
  'Perfil con insignia Verificado ✓',
  'Prioridad en resultados de búsqueda',
  'Notificaciones de nuevos vehículos',
  'Soporte prioritario 24 hs',
]

const PREMIUM_FEATURES_PROPIETARIO = [
  'Vehículos ilimitados publicados',
  'Listados destacados en búsqueda',
  'Insignia de Propietario Verificado ✓',
  'Estadísticas de vistas y solicitudes',
  'Soporte prioritario 24 hs',
]

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, plan, subscription_status')
    .eq('user_id', user.id)
    .single()

  const isPremium = profile?.plan === 'premium'
  const isConductor = profile?.role === 'conductor'
  const role = profile?.role ?? 'conductor'

  const freeFeatures = isConductor ? FREE_FEATURES_CONDUCTOR : FREE_FEATURES_PROPIETARIO
  const premiumFeatures = isConductor ? PREMIUM_FEATURES_CONDUCTOR : PREMIUM_FEATURES_PROPIETARIO
  const price = isConductor ? '$2.990' : '$3.990'

  return (
    <>
      <TopBar title="Plan Premium" showBack backHref="/dashboard" />
      <SuccessBanner />

      <div className="p-4 space-y-4 pb-8">
        <div className="text-center py-4">
          <Crown size={40} className="text-amber-500 mx-auto mb-2" />
          <h2 className="text-2xl font-extrabold text-calm-800">VehiLink Premium</h2>
          <p className="text-calm-500 text-sm mt-1">
            {isConductor ? 'Sin límites para encontrar tu vehículo.' : 'Publicá sin restricciones.'}
          </p>
        </div>

        {/* Free plan */}
        <div className={`rounded-3xl p-5 border-2 ${isPremium ? 'border-calm-100 bg-white opacity-60' : 'border-calm-200 bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-calm-800">Gratuito</h3>
              <p className="text-2xl font-extrabold text-calm-700 mt-1">$0 <span className="text-sm font-semibold text-calm-400">/mes</span></p>
            </div>
            {!isPremium && (
              <span className="bg-calm-100 text-calm-600 text-xs font-bold px-3 py-1 rounded-full">Plan actual</span>
            )}
          </div>
          <ul className="space-y-2">
            {freeFeatures.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-calm-600">
                <Check size={14} className="text-calm-400 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium plan */}
        <div className={`rounded-3xl p-5 border-2 relative overflow-hidden ${isPremium ? 'border-amber-300 bg-amber-50/50' : 'border-calm-500 bg-gradient-to-br from-calm-50 to-white shadow-lg'}`}>
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-100 rounded-full opacity-50" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-calm-800">Premium</h3>
              <p className="text-2xl font-extrabold text-calm-700 mt-1">
                {price} <span className="text-sm font-semibold text-calm-400">ARS / mes</span>
              </p>
            </div>
            {isPremium && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Activo ✓</span>
            )}
          </div>
          <ul className="space-y-2 mb-5">
            {premiumFeatures.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-calm-700">
                <Check size={14} className="text-forest mt-0.5 shrink-0" strokeWidth={3} />
                {f}
              </li>
            ))}
          </ul>

          {!isPremium ? (
            <CheckoutButton role={role} />
          ) : (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-bold px-4 py-3 rounded-xl text-center">
              ✅ Tenés acceso a todas las funciones Premium
            </div>
          )}
        </div>

        {/* Freemium limit warning */}
        {!isPremium && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Lock size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Límites del plan gratuito</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {isConductor
                  ? 'Podés tener hasta 3 solicitudes activas. Con Premium: ilimitadas.'
                  : 'Podés publicar 1 vehículo. Con Premium: ilimitados.'}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-calm-400 text-center px-4">
          Podés cancelar cuando quieras. Los pagos son procesados de forma segura.
        </p>
      </div>
    </>
  )
}
