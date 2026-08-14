import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS, type SupportTicket } from '@/types'
import { ChevronRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  abierto: 'bg-red-100 text-red-700',
  en_revision: 'bg-yellow-100 text-yellow-700',
  resuelto: 'bg-green-100 text-green-700',
  cerrado: 'bg-gray-100 text-gray-500',
}

export default async function AdminTicketsPage() {
  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*, user:profiles!user_id(full_name, role)')
    .order('created_at', { ascending: false })

  const list = (tickets ?? []) as unknown as SupportTicket[]

  const open = list.filter(t => t.status === 'abierto' || t.status === 'en_revision')
  const closed = list.filter(t => t.status === 'resuelto' || t.status === 'cerrado')

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-xl font-extrabold text-calm-800">Tickets de soporte</h1>

      {list.length === 0 && (
        <div className="text-center py-16 text-calm-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-bold">No hay tickets pendientes</p>
        </div>
      )}

      {open.length > 0 && (
        <section>
          <h2 className="text-sm font-extrabold text-calm-600 mb-2 px-1">
            Pendientes ({open.length})
          </h2>
          <div className="space-y-2">
            {open.map(t => <TicketRow key={t.id} ticket={t} />)}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section>
          <h2 className="text-sm font-extrabold text-calm-400 mb-2 px-1">Resueltos</h2>
          <div className="space-y-2 opacity-70">
            {closed.map(t => <TicketRow key={t.id} ticket={t} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  const user = ticket.user as unknown as { full_name: string; role: string } | undefined
  return (
    <Link
      href={`/admin/tickets/${ticket.id}`}
      className="flex items-center justify-between bg-white border border-calm-200 rounded-2xl p-3.5 hover:border-calm-400 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status]}`}>
            {TICKET_STATUS_LABELS[ticket.status]}
          </span>
          <span className="text-xs text-calm-400">{TICKET_CATEGORY_LABELS[ticket.category]}</span>
        </div>
        <p className="font-bold text-calm-800 text-sm truncate">{ticket.subject}</p>
        <p className="text-xs text-calm-400 mt-0.5">
          {user?.full_name} · {user?.role} · {new Date(ticket.created_at).toLocaleDateString('es-AR')}
        </p>
      </div>
      <ChevronRight size={16} className="text-calm-300 shrink-0 ml-2" />
    </Link>
  )
}
