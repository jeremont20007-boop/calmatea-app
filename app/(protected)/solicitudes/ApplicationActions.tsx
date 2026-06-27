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
          value={response}
          onChange={e => setResponse(e.target.value)}
          placeholder="Mensaje opcional para el conductor..."
          rows={3}
          className="w-full px-3 py-2 rounded-xl border-2 border-calm-200 text-sm text-calm-800 placeholder:text-calm-300 focus:outline-none focus:border-calm-400 resize-none"
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setShowResponse(!showResponse)}
          className="text-xs text-calm-400 hover:text-calm-600 font-semibold transition-colors"
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
          className="flex-1 bg-forest hover:bg-green-700"
          onClick={() => updateStatus('aceptada')}
          disabled={loading !== null}
        >
          {loading === 'accept' ? 'Aceptando...' : 'Aceptar ✓'}
        </Button>
      </div>
    </div>
  )
}
