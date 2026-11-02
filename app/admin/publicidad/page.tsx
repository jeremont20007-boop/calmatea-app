import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Eye, ExternalLink } from 'lucide-react'
import { AD_STATUS_LABELS, AD_STATUS_COLORS, type Ad, type Advertiser } from '@/types'
import { AdApprovalActions } from './AdApprovalActions'

type AdWithAdvertiser = Ad & { advertiser: Advertiser }

export default async function AdminPublicidadPage() {
  const supabase = await createClient()

  const { data: ads } = await supabase
    .from('ads')
    .select('*, advertiser:advertisers(id, company_name, contact_email, status)')
    .order('created_at', { ascending: false })

  const allAds = (ads ?? []) as unknown as AdWithAdvertiser[]
  const pending = allAds.filter(a => a.status === 'pending_review')
  const active = allAds.filter(a => a.status === 'active')
  const other = allAds.filter(a => !['pending_review', 'active'].includes(a.status))

  const totalImpressions = allAds.reduce((sum, a) => sum + (a.current_impressions || 0), 0)

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-calm-800">Publicidad</h1>
        <p className="text-sm text-calm-500 mt-0.5">
          {allAds.length} anuncios totales · {totalImpressions.toLocaleString()} impresiones
        </p>
      </div>

      {/* Pending review */}
      {pending.length > 0 && (
        <div>
          <h2 className="font-extrabold text-calm-700 mb-3 flex items-center gap-2">
            En revisión
            <span className="bg-yellow-400 text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
              {pending.length}
            </span>
          </h2>
          <div className="space-y-3">
            {pending.map(ad => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </div>
      )}

      {/* Active ads */}
      {active.length > 0 && (
        <div>
          <h2 className="font-extrabold text-calm-700 mb-3">Anuncios activos</h2>
          <div className="space-y-3">
            {active.map(ad => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </div>
      )}

      {/* Others */}
      {other.length > 0 && (
        <div>
          <h2 className="font-extrabold text-calm-700 mb-3">Historial</h2>
          <div className="space-y-3">
            {other.map(ad => (
              <AdCard key={ad.id} ad={ad} showHistory />
            ))}
          </div>
        </div>
      )}

      {allAds.length === 0 && (
        <div className="text-center py-16 text-calm-400 text-sm">
          <div className="text-5xl mb-3">📢</div>
          <p>Aún no hay anuncios registrados.</p>
        </div>
      )}
    </div>
  )
}

function AdCard({ ad, showHistory = false }: { ad: AdWithAdvertiser; showHistory?: boolean }) {
  return (
    <Card>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-extrabold text-calm-800">{ad.title}</p>
          {ad.description && (
            <p className="text-xs text-calm-500 mt-0.5 line-clamp-2">{ad.description}</p>
          )}
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${AD_STATUS_COLORS[ad.status]}`}>
          {AD_STATUS_LABELS[ad.status]}
        </span>
      </div>

      {/* Advertiser */}
      <div className="bg-calm-50 rounded-xl p-2.5 text-xs space-y-0.5">
        <p className="font-bold text-calm-700">{ad.advertiser?.company_name}</p>
        <p className="text-calm-400">{ad.advertiser?.contact_email}</p>
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
          ad.advertiser?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          Cuenta: {ad.advertiser?.status === 'active' ? 'Activa' : 'Pendiente'}
        </span>
      </div>

      {/* Stats + link */}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-calm-500">
        <span className="flex items-center gap-1">
          <Eye size={12} />
          {ad.current_impressions} imp.
        </span>
        {ad.duration_days && (
          <span className="font-semibold">{ad.duration_days} días</span>
        )}
        {ad.total_price && (
          <span className="font-bold text-calm-700">
            ${ad.total_price.toLocaleString('es-AR')} ARS
          </span>
        )}
        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
          ad.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
          ad.payment_status === 'free' ? 'bg-blue-100 text-blue-600' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {ad.payment_status === 'paid' ? 'Pagado' : ad.payment_status === 'free' ? 'Gratuito' : 'Pago pendiente'}
        </span>
        {(ad.mobile_image_url || ad.desktop_image_url) && (
          <span className="text-calm-400">📷</span>
        )}
        <a
          href={ad.target_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-calm-400 hover:text-calm-600 ml-auto"
        >
          <ExternalLink size={11} />
          Destino
        </a>
      </div>
      {ad.mobile_image_url && (
        <img
          src={ad.mobile_image_url}
          alt="Mobile preview"
          className="mt-2 w-full rounded-xl object-cover border border-calm-100"
          style={{ aspectRatio: '750/300' }}
        />
      )}

      {!showHistory && (
        <AdApprovalActions
          adId={ad.id}
          advertiserId={ad.advertiser_id}
          currentStatus={ad.status}
        />
      )}
    </Card>
  )
}
