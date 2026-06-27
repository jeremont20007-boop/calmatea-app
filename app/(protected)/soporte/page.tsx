'use client'

import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { TICKET_CATEGORY_LABELS, type TicketCategory, type SupportTicket } from '@/types'
import { useEffect } from 'react'
import { MessageSquare, CheckCircle } from 'lucide-react'

const CATEGORIES = Object.entries(TICKET_CATEGORY_LABELS) as [TicketCategory, string][]

const STATUS_COLORS: Record<string, string> = {
  abierto: 'bg-red-100 text-red-700',
  en_revision: 'bg-yellow-100 text-yellow-700',
  resuelto: 'bg-green-100 text-green-700',
  cerrado: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  abierto: 'Abierto',
  en_revision: 'En revisión',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

export default function SoportePage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<TicketCategory>('otro')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('id').eq('user_id', user.id).single()
      if (!profile) return
      setProfileId(profile.id)
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setMyTickets((tickets ?? []) as unknown as SupportTicket[])
    }
    load()
  }, [sent])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      setError('Completá el asunto y el mensaje')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('support_tickets')
      .insert({ user_id: profileId, subject: subject.trim(), message: message.trim(), category })
    setLoading(false)
    if (err) {
      setError('Error al enviar el ticket. Intentá de nuevo.')
      return
    }
    setSent(v => !v)
    setSubject('')
    setMessage('')
    setCategory('otro')
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Soporte" showBack backHref="/dashboard" />

      <div className="p-4 space-y-5 pb-8">

        {/* New ticket form */}
        <div className="bg-white rounded-3xl border border-calm-100 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-calm-500" />
            <h2 className="font-extrabold text-calm-800">Nuevo ticket</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-calm-600 mb-1.5">Categoría</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCategory(val)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border-2 transition-colors ${
                      category === val ? 'bg-calm-500 text-white border-calm-500' : 'border-calm-200 text-calm-500 hover:border-calm-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-calm-600 mb-1.5">Asunto</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Describí brevemente tu consulta"
                className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 text-calm-800 text-sm font-medium placeholder:text-calm-300 focus:outline-none focus:border-calm-400 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-calm-600 mb-1.5">Detalle</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Explicá con más detalle tu consulta, falla o solicitud..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 text-calm-800 text-sm font-medium placeholder:text-calm-300 focus:outline-none focus:border-calm-400 transition-colors resize-none"
                required
              />
            </div>

            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

            <Button type="submit" size="md" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar ticket'}
            </Button>
          </form>
        </div>

        {/* My tickets */}
        {myTickets.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-extrabold text-calm-700 px-1">Mis consultas</h2>
            {myTickets.map(t => (
              <div key={t.id} className="bg-white rounded-2xl border border-calm-200 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-calm-800 text-sm">{t.subject}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </div>
                <p className="text-xs text-calm-400">{new Date(t.created_at).toLocaleDateString('es-AR')}</p>
                {t.admin_response && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle size={12} className="text-green-500" />
                      <p className="text-xs font-bold text-green-700">Respuesta del equipo</p>
                    </div>
                    <p className="text-sm text-green-800 leading-relaxed">{t.admin_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-calm-400 text-center px-4 leading-relaxed">
          Nuestro equipo responde en 24–48 hs hábiles.
        </p>
      </div>
    </div>
  )
}
