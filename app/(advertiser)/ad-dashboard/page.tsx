import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Megaphone, Plus, TrendingUp, Eye, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { AD_STATUS_LABELS, AD_STATUS_COLORS, type Ad } from '@/types'

export default async function AdDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/publicitario')

  const { data: advertiser } = await supabase
    .from('advertisers')
    .select('id, company_name, status')
    .eq('user_id', user.id)
    .single()

  if (!advertiser) redirect('/auth/publicitario')

  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .eq('advertiser_id', advertiser.id)
    .order('created_at', { ascending: false })

  const adList = (ads ?? []) as unknown as Ad[]
  const activeAds = adList.filter(a => a.status === 'active')
  const totalImpressions = adList.reduce((sum, a) => sum + (a.current_impressions || 0), 0)
  const pendingAds = adList.filter(a => a.status === 'pending_review')

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-calm-600 to-calm-800 rounded-3xl p-5 text-white">
        <p className="text-calm-300 text-sm font-semibold">Panel de publicidad</p>
        <h2 className="text-2xl font-extrabold mt-0.5">{advertiser.company_name}</h2>
        {advertiser.status === 'pending' && (
          <p className="text-yellow-300 text-xs font-semibold mt-2 bg-yellow-400/10 px-3 py-1.5 rounded-xl inline-block">
            Cuenta en revisión — tu primer anuncio activará la cuenta
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <Eye size={20} className="text-calm-400 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-calm-700">{totalImpressions}</p>
          <p className="text-[10px] text-calm-400 font-semibold mt-0.5">Impresiones</p>
        </Card>
        <Card className="text-center py-4">
          <CheckCircle size={20} className="text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-calm-700">{activeAds.length}</p>
          <p className="text-[10px] text-calm-400 font-semibold mt-0.5">Activos</p>
        </Card>
        <Card className="text-center py-4">
          <TrendingUp size={20} className="text-calm-500 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-calm-700">{adList.length}</p>
          <p className="text-[10px] text-calm-400 font-semibold mt-0.5">Total</p>
        </Card>
      </div>

      {/* Quick action */}
      <Link href="/anuncios/nuevo">
        <Card className="bg-calm-500 border-0 text-white hover:bg-calm-600 transition-colors">
          <div className="flex items-center gap-3 py-1">
            <Plus size={24} />
            <div>
              <p className="font-extrabold">Crear nuevo anuncio</p>
              <p className="text-calm-200 text-xs">Llegá a miles de conductores y propietarios</p>
            </div>
          </div>
        </Card>
      </Link>

      {/* Pending review alert */}
      {pendingAds.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="font-bold text-yellow-800 text-sm">
            {pendingAds.length} anuncio{pendingAds.length > 1 ? 's' : ''} en revisión
          </p>
          <p className="text-xs text-yellow-700 mt-0.5">
            Nuestro equipo revisará y activará tu anuncio en breve.
          </p>
        </div>
      )}

      {/* Recent ads */}
      {adList.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-extrabold text-calm-700">Anuncios recientes</h3>
            <Link href="/anuncios" className="text-xs text-calm-500 font-semibold hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {adList.slice(0, 3).map(ad => (
              <Card key={ad.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-extrabold text-calm-800 text-sm truncate">{ad.title}</p>
                    <p className="text-xs text-calm-400 mt-0.5">{ad.current_impressions} impresiones</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${AD_STATUS_COLORS[ad.status]}`}>
                    {AD_STATUS_LABELS[ad.status]}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {adList.length === 0 && (
        <Card className="text-center py-10 border-dashed border-2 border-calm-200">
          <Megaphone size={36} className="text-calm-300 mx-auto mb-3" />
          <p className="font-extrabold text-calm-600">Aún no tenés anuncios</p>
          <p className="text-sm text-calm-400 mt-1">Creá tu primer anuncio para empezar</p>
        </Card>
      )}

      {/* Info card */}
      <Card className="bg-calm-50 border-calm-200">
        <p className="font-bold text-calm-700 text-sm mb-2">¿Cómo funciona?</p>
        <ol className="text-xs text-calm-600 space-y-1.5 list-decimal list-inside">
          <li>Creás tu anuncio con título, descripción e imagen</li>
          <li>Nuestro equipo lo revisa (generalmente en 24 hs)</li>
          <li>Una vez aprobado, tu anuncio se muestra a los usuarios</li>
          <li>Los usuarios gratuitos ven más anuncios; los Premium, menos</li>
        </ol>
        <p className="text-xs text-calm-400 mt-3">
          Para consultar tarifas o necesitás ayuda, contactanos en{' '}
          <span className="font-semibold">publicidad@vehilink.com.ar</span>
        </p>
      </Card>
    </div>
  )
}
