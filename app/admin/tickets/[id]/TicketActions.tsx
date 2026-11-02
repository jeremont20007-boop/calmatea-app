'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TicketStatus } from '@/types'

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'abierto', label: 'Abierto' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'cerrado', label: 'Cerrado' },
]

export function TicketActions({ ticketId, currentStatus, currentResponse }: {
  ticketId: string
  currentStatus: TicketStatus
  currentResponse?: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState<TicketStatus>(currentStatus)
  const [response, setResponse] = useState(currentResponse || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('support_tickets')
      .update({ status, admin_response: response.trim() || null })
      .eq('id', ticketId)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-4 bg-calm-800 rounded-2xl p-4">
      <p className="text-xs font-extrabold text-calm-300">Respuesta del administrador</p>

      <div>
        <label className="block text-xs text-calm-400 font-semibold mb-1.5">Estado del ticket</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as TicketStatus)}
          className="w-full px-3 py-2 rounded-xl bg-calm-700 text-white text-sm font-semibold border border-calm-600 focus:outline-none focus:border-calm-400"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-calm-400 font-semibold mb-1.5">Respuesta</label>
        <textarea
          value={response}
          onChange={e => setResponse(e.target.value)}
          placeholder="Respuesta al usuario..."
          rows={4}
          className="w-full px-3 py-2 rounded-xl bg-calm-700 text-white text-sm placeholder:text-calm-500 border border-calm-600 focus:outline-none focus:border-calm-400 resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-calm-500 text-white font-extrabold text-sm hover:bg-calm-400 transition-colors disabled:opacity-50"
      >
        {loading ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar respuesta'}
      </button>
    </div>
  )
}
