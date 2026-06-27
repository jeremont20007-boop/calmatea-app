import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Eye, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { AD_STATUS_LABELS, AD_STATUS_COLORS, type Ad } from '@/types'

export default async function MisAnunciosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/publicitario')

  const { data: advertiser } = await supabase
    .from('advertisers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!advertiser) redirect('/auth/publicitario')

  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .eq('advertiser_id', advertiser.id)
    .order('created_at', { ascending: false })

  const adList = (ads ?? []) as unknown as Ad[]

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-calm-800">Mis anuncios</h1>
        <Link
          href="/anuncios/nuevo"
          className="flex items-center gap-1.5 bg-calm-500 hover:bg-calm-600 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Nuevo
        </Link>
      </div>

      {adList.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="text-5xl">📢</div>
          <p className="font-extrabold text-calm-700">Aún no tenés anuncios</p>
          <p className="text-calm-400 text-sm">Creá tu primer anuncio y llegá a miles de usuarios</p>
          <Link
            href="/anuncios/nuevo"
            className="inline-block bg-calm-500 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-calm-600 transition-colors mt-2"
          >
            + Crear anuncio
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {adList.map(ad => (
          <Card key={ad.id}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-calm-800">{ad.title}</p>
                {ad.description && (
                  <p className="text-sm text-calm-500 mt-0.5 line-clamp-2">{ad.description}</p>
                )}
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${AD_STATUS_COLORS[ad.status]}`}>
                {AD_STATUS_LABELS[ad.status]}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-calm-500 border-t border-calm-100 pt-3">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {ad.current_impressions} impresiones
              </span>
              {ad.max_impressions && (
                <span>/ {ad.max_impressions} máx</span>
              )}
              {ad.starts_at && (
                <span>Desde {new Date(ad.starts_at).toLocaleDateString('es-AR')}</span>
              )}
              {ad.ends_at && (
                <span>hasta {new Date(ad.ends_at).toLocaleDateString('es-AR')}</span>
              )}
            </div>

            <div className="flex items-center justify-between mt-3">
              <a
                href={ad.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-calm-400 hover:text-calm-600 transition-colors truncate max-w-[200px]"
              >
                <ExternalLink size={11} />
                {ad.target_url}
              </a>
              <Link
                href={`/anuncios/${ad.id}`}
                className="text-xs font-bold text-calm-500 hover:text-calm-700 transition-colors shrink-0"
              >
                Editar →
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
