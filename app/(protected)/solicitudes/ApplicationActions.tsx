'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface ApplicationActionsProps {
  applicationId: string
}

export function ApplicationActions({ applicationId }: ApplicationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const [response, setResponse] = useState('')
  const [showResponse, setShowResponse] = useState(false)

  async function updateStatus(status: 'aceptada' | 'rechazada') {
    setLoading(status === 'aceptada' ? 'accept' : 'reject')
    const supabase = createClient()
    await supabase
      .from('applications')
      .update({ status, owner_response: response.trim() || null })
      .eq('id', applicationId)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="space-y-3 border-t border-calm-100 pt-3">
      {showResponse && (
        <textarea
          aria-label="Mensaje para el conductor (opcional)"
          value={response}
          onChange={e => setResponse(e.target.value)}
          placeholder="Mensaje opcional para el conductor..."
          rows={3}
          className="w-full px-3 py-2 rounded-xl border-2 border-calm-200 text-sm text-calm-800 placeholder:text-calm-400 focus:outline-none focus:border-calm-500 focus:ring-2 focus:ring-calm-500/30 resize-none"
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowResponse(!showResponse)}
          aria-expanded={showResponse}
          className="text-xs text-calm-500 hover:text-calm-700 font-semibold transition-colors"
        >
          {showResponse ? 'Ocultar mensaje' : '+ Agregar mensaje'}
        </button>
      </div>
      <div className="flex gap-2">
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          onClick={() => updateStatus('rechazada')}
          disabled={loading !== null}
        >
          {loading === 'reject' ? 'Rechazando...' : 'Rechazar'}
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-emerald-700 hover:bg-emerald-800"
          onClick={() => updateStatus('aceptada')}
          disabled={loading !== null}
        >
          {loading === 'accept' ? 'Aceptando...' : <>Aceptar <span aria-hidden="true">✓</span></>}
        </Button>
      </div>
    </div>
  )
}
