import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS, type SupportTicket } from '@/types'
import { TicketActions } from './TicketActions'
import { ArrowLeft } from 'lucide-react'

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*, user:profiles!user_id(id, full_name, role, city, phone)')
    .eq('id', id)
    .single()

  if (!ticket) notFound()

  const t = ticket as unknown as SupportTicket

  const statusColors: Record<string, string> = {
    abierto: 'bg-red-100 text-red-700',
    en_revision: 'bg-yellow-100 text-yellow-700',
    resuelto: 'bg-green-100 text-green-700',
    cerrado: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/tickets" className="text-calm-500 hover:text-calm-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-extrabold text-calm-800 text-lg">Ticket #{id.slice(0, 8)}</h1>
      </div>

      {/* Status + category */}
      <div className="flex gap-2 flex-wrap">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[t.status]}`}>
          {TICKET_STATUS_LABELS[t.status]}
        </span>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-calm-100 text-calm-600">
          {TICKET_CATEGORY_LABELS[t.category]}
        </span>
      </div>

      {/* User info */}
      {t.user && (
        <div className="bg-calm-50 rounded-2xl p-3 space-y-1">
          <p className="font-bold text-calm-800 text-sm">{(t.user as unknown as { full_name: string }).full_name}</p>
          <p className="text-xs text-calm-500">Rol: {(t.user as unknown as { role: string }).role}</p>
          {(t.user as unknown as { phone?: string }).phone && (
            <p className="text-xs text-calm-500">Tel: {(t.user as unknown as { phone: string }).phone}</p>
          )}
          <p className="text-xs text-calm-400">{new Date(t.created_at).toLocaleString('es-AR')}</p>
        </div>
      )}

      {/* Ticket content */}
      <div className="bg-white rounded-2xl border border-calm-200 p-4 space-y-2">
        <p className="font-extrabold text-calm-800">{t.subject}</p>
        <p className="text-sm text-calm-600 leading-relaxed whitespace-pre-wrap">{t.message}</p>
      </div>

      {/* Previous response if exists */}
      {t.admin_response && (
        <div className="bg-blue-50 rounded-2xl p-3">
          <p className="text-xs font-bold text-blue-600 mb-1">Respuesta anterior</p>
          <p className="text-sm text-blue-800 leading-relaxed">{t.admin_response}</p>
        </div>
      )}

      {/* Actions */}
      <TicketActions
        ticketId={t.id}
        currentStatus={t.status}
        currentResponse={t.admin_response}
      />
    </div>
  )
}
