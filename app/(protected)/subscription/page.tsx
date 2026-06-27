import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { CheckoutButton } from './CheckoutButton'
import { SuccessBanner } from './SuccessBanner'
import { Check, Crown } from 'lucide-react'

const FREE_FEATURES_CONDUCTOR = [
  'Hasta 5 solicitudes por mes',
  'Acceso al listado completo de vehículos',
  'Historial de solicitudes básico',
]

const FREE_FEATURES_PROPIETARIO = [
  '1 vehículo publicado',
  'Recibir solicitudes ilimitadas',
  'Gestión básica de aplicaciones',
]

const PREMIUM_FEATURES_CONDUCTOR = [
  'Solicitudes ilimitadas',
  'Perfil con insignia Verificado ✓',
  'Prioridad en la lista de conductores',
  'Notificaciones de nuevos vehículos',
  'Historial completo',
]

const PREMIUM_FEATURES_PROPIETARIO = [
  'Vehículos ilimitados',
  'Listados destacados en búsqueda',
  'Insignia de Propietario Verificado ✓',
  'Estadísticas detalladas',
  'Soporte prioritario',
]

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, plan, stripe_customer_id, subscription_status')
    .eq('user_id', user.id)
    .single()

  const isPremium = profile?.plan === 'premium'
  const isConductor = profile?.role === 'conductor'

  const freeFeatures = isConductor ? FREE_FEATURES_CONDUCTOR : FREE_FEATURES_PROPIETARIO
  const premiumFeatures = isConductor ? PREMIUM_FEATURES_CONDUCTOR : PREMIUM_FEATURES_PROPIETARIO

  return (
    <>
      <TopBar title="Plan Premium" showBack backHref="/dashboard" />
      <SuccessBanner />
      <div className="p-4 space-y-4 pb-8">
        <div className="text-center py-4">
          <div className="text-5xl mb-2">🚗</div>
          <h2 className="text-2xl font-extrabold text-calm-800">Desbloquea VehiLink Premium</h2>
          <p className="text-calm-500 text-sm mt-1">
            {isConductor ? 'Más solicitudes, más oportunidades.' : 'Más visibilidad, más conductores.'}
          </p>
        </div>

        {/* Free plan */}
        <div className={`rounded-3xl p-5 border-2 ${isPremium ? 'border-calm-100 bg-white opacity-60' : 'border-calm-300 bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-extrabold text-calm-800">Gratuito</h3>
              <p className="text-3xl font-extrabold text-calm-700 mt-1">
                $0 <span className="text-base font-semibold text-calm-400">/mes</span>
              </p>
            </div>
            {!isPremium && (
              <span className="bg-calm-100 text-calm-600 text-xs font-bold px-3 py-1 rounded-full">Plan actual</span>
            )}
          </div>
          <ul className="space-y-2">
            {freeFeatures.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-calm-600">
                <Check size={16} className="text-calm-400 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium plan */}
        <div className={`rounded-3xl p-5 border-2 relative overflow-hidden ${isPremium ? 'border-sunshine bg-sunshine/10' : 'border-calm-400 bg-gradient-to-br from-calm-50 to-white shadow-lg'}`}>
          <div className="absolute top-3 right-3">
            <Crown size={24} className="text-amber-500" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-extrabold text-calm-800">Premium</h3>
              <p className="text-3xl font-extrabold text-calm-700 mt-1">
                $9.99 <span className="text-base font-semibold text-calm-400">/mes</span>
              </p>
            </div>
            {isPremium && (
              <span className="bg-forest text-white text-xs font-bold px-3 py-1 rounded-full">Activo ✓</span>
            )}
          </div>
          <ul className="space-y-2 mb-5">
            {premiumFeatures.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-calm-700">
                <Check size={16} className="text-forest mt-0.5 shrink-0" strokeWidth={3} />
                {f}
              </li>
            ))}
          </ul>

          {!isPremium ? (
            <CheckoutButton />
          ) : (
            <div className="bg-forest/10 text-forest text-sm font-bold px-4 py-3 rounded-xl text-center">
              ✅ Tienes acceso a todas las funciones Premium
            </div>
          )}
        </div>

        {isPremium && profile?.stripe_customer_id && (
          <form action="/api/stripe-portal" method="POST">
            <input type="hidden" name="customerId" value={profile.stripe_customer_id} />
            <button type="submit" className="w-full text-calm-500 text-sm font-semibold hover:underline py-2">
              Gestionar suscripción →
            </button>
          </form>
        )}

        <p className="text-xs text-calm-400 text-center px-4">
          Pago seguro con Stripe. Sin permanencia, cancela cuando quieras.
        </p>
      </div>
    </>
  )
}
