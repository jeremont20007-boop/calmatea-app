'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CreativeStatus } from '@/types'

interface Props {
  requestId: string
  currentStatus: CreativeStatus
}

const NEXT_STATUSES: Partial<Record<CreativeStatus, { status: CreativeStatus; label: string; className: string }[]>> = {
  pending:     [{ status: 'in_progress', label: 'Iniciar producción', className: 'bg-blue-500 hover:bg-blue-600 text-white' }],
  in_progress: [
    { status: 'delivered', label: '✓ Marcar entregado', className: 'bg-green-500 hover:bg-green-600 text-white' },
    { status: 'revision',  label: 'Enviar a revisión',  className: 'bg-orange-100 hover:bg-orange-200 text-orange-700' },
  ],
  revision:    [{ status: 'in_progress', label: 'Volver a producción', className: 'bg-blue-100 hover:bg-blue-200 text-blue-700' }],
  delivered:   [],
}

export function CreativeStatusActions({ requestId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const actions = NEXT_STATUSES[currentStatus] ?? []
  if (actions.length === 0) return null

  async function updateStatus(newStatus: CreativeStatus) {
    setLoading(newStatus)
    const supabase = createClient()
    await supabase
      .from('creative_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-calm-100">
      {actions.map(a => (
        <button
          key={a.status}
          onClick={() => updateStatus(a.status)}
          disabled={loading !== null}
          className={`flex-1 py-2 font-bold text-xs rounded-xl transition-colors disabled:opacity-50 ${a.className}`}
        >
          {loading === a.status ? '...' : a.label}
        </button>
      ))}
    </div>
  )
}
