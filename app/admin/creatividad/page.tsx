import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import {
  CREATIVE_TIERS, CREATIVE_DELIVERABLES,
  CREATIVE_STATUS_LABELS, CREATIVE_STATUS_COLORS,
  type CreativeRequest, type Advertiser, type Ad,
} from '@/types'
import { CreativeStatusActions } from './CreativeStatusActions'
import { Sparkles } from 'lucide-react'

type RequestWithRelations = CreativeRequest & {
  ad: Pick<Ad, 'id' | 'title'>
  advertiser: Pick<Advertiser, 'company_name' | 'contact_email'>
}

export default async function AdminCreatividadPage() {
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from('creative_requests')
    .select('*, ad:ads(id, title), advertiser:advertisers(company_name, contact_email)')
    .order('created_at', { ascending: false })

  const all = (requests ?? []) as unknown as RequestWithRelations[]

  const pending     = all.filter(r => r.status === 'pending')
  const inProgress  = all.filter(r => r.status === 'in_progress')
  const revision    = all.filter(r => r.status === 'revision')
  const delivered   = all.filter(r => r.status === 'delivered')

  const totalRevenue = all.reduce((s, r) => s + (r.price_ars || 0), 0)

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-calm-800 flex items-center gap-2">
          <Sparkles size={20} className="text-calm-500" />
          Creatividad
        </h1>
        <p className="text-sm text-calm-500 mt-0.5">
          {all.length} solicitudes · ${totalRevenue.toLocaleString('es-AR')} ARS potenciales
        </p>
      </div>

      {pending.length > 0 && (
        <Section title="Nuevas solicitudes" count={pending.length} badge="yellow">
          {pending.map(r => <RequestCard key={r.id} r={r} />)}
        </Section>
      )}

      {inProgress.length > 0 && (
        <Section title="En producción" count={inProgress.length} badge="blue">
          {inProgress.map(r => <RequestCard key={r.id} r={r} />)}
        </Section>
      )}

      {revision.length > 0 && (
        <Section title="En revisión" count={revision.length} badge="orange">
          {revision.map(r => <RequestCard key={r.id} r={r} />)}
        </Section>
      )}

      {delivered.length > 0 && (
        <Section title="Entregados" badge="green">
          {delivered.map(r => <RequestCard key={r.id} r={r} />)}
        </Section>
      )}

      {all.length === 0 && (
        <div className="text-center py-16 text-calm-400 text-sm">
          <div className="text-5xl mb-3">✦</div>
          <p>Aún no hay solicitudes de creatividad.</p>
        </div>
      )}
    </div>
  )
}

function Section({
  title, count, badge = 'gray', children,
}: {
  title: string; count?: number; badge?: string; children: React.ReactNode
}) {
  const badgeColors: Record<string, string> = {
    yellow: 'bg-yellow-400 text-white',
    blue:   'bg-blue-500 text-white',
    orange: 'bg-orange-400 text-white',
    green:  'bg-green-500 text-white',
    gray:   'bg-calm-300 text-white',
  }
  return (
    <div>
      <h2 className="font-extrabold text-calm-700 mb-3 flex items-center gap-2">
        {title}
        {count !== undefined && (
          <span className={`text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center ${badgeColors[badge]}`}>
            {count}
          </span>
        )}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function RequestCard({ r }: { r: RequestWithRelations }) {
  const tier = CREATIVE_TIERS.find(t => t.tier === r.tier)
  const deliverableLabels = r.selected_deliverables.map(
    sid => CREATIVE_DELIVERABLES.find(d => d.id === sid)?.label ?? sid
  )

  return (
    <Card>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-extrabold text-calm-800 truncate">{r.ad?.title}</p>
          <p className="text-xs text-calm-500">{r.advertiser?.company_name} · {r.advertiser?.contact_email}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${CREATIVE_STATUS_COLORS[r.status]}`}>
          {CREATIVE_STATUS_LABELS[r.status]}
        </span>
      </div>

      {/* Tier */}
      <div className="bg-calm-50 rounded-xl p-2.5 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-calm-700">
            {tier?.tier === 7 ? '✦ Premium' : tier?.label}
            {tier && tier.tier < 7 && (
              <span className="ml-1 text-yellow-400">{'★'.repeat(tier.tier)}</span>
            )}
          </span>
          <span className="font-extrabold text-calm-700">
            ${(r.price_ars ?? 0).toLocaleString('es-AR')} ARS
          </span>
        </div>
        <p className="text-calm-400">
          {new Date(r.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Selected deliverables */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {deliverableLabels.map((label, i) => (
          <span key={i} className="text-[10px] font-semibold bg-calm-100 text-calm-600 px-2 py-0.5 rounded-full">
            {label}
          </span>
        ))}
      </div>

      {/* Notes */}
      {r.notes && (
        <p className="mt-2 text-xs text-calm-500 italic bg-calm-50 rounded-lg p-2">
          &ldquo;{r.notes}&rdquo;
        </p>
      )}

      <CreativeStatusActions requestId={r.id} currentStatus={r.status} />
    </Card>
  )
}
