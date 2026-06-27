'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'

interface DocReviewActionsProps {
  docId: string
  table: 'driver_documents' | 'vehicle_documents'
  currentStatus: string
}

export function DocReviewActions({ docId, table, currentStatus }: DocReviewActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'aprobado' | 'rechazado' | null>(null)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  async function updateStatus(status: 'aprobado' | 'rechazado') {
    setLoading(status)
    const supabase = createClient()
    await supabase
      .from(table)
      .update({ status, notes: notes.trim() || null })
      .eq('id', docId)
    setLoading(null)
    router.refresh()
  }

  if (currentStatus === 'aprobado') {
    return (
      <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
        ✓ Aprobado
      </span>
    )
  }

  if (currentStatus === 'rechazado') {
    return (
      <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
        ✗ Rechazado
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {showNotes && (
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Motivo (opcional)"
          className="text-xs border border-calm-200 rounded-lg px-2 py-1 w-40 focus:outline-none"
        />
      )}
      <button
        onClick={() => setShowNotes(!showNotes)}
        className="text-xs text-calm-400 hover:text-calm-600 font-semibold"
      >
        {showNotes ? '↑' : '+ Nota'}
      </button>
      <button
        onClick={() => updateStatus('rechazado')}
        disabled={loading !== null}
        className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        <X size={12} /> Rechazar
      </button>
      <button
        onClick={() => updateStatus('aprobado')}
        disabled={loading !== null}
        className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
      >
        <Check size={12} /> Aprobar
      </button>
    </div>
  )
}
