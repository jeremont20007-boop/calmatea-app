'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AdStatus } from '@/types'

interface AdApprovalActionsProps {
  adId: string
  advertiserId: string
  currentStatus: AdStatus
}

export function AdApprovalActions({ adId, advertiserId, currentStatus }: AdApprovalActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(newStatus: AdStatus) {
    setLoading(newStatus)
    const supabase = createClient()

    await supabase.from('ads').update({ status: newStatus }).eq('id', adId)

    // When approving, also mark advertiser as active
    if (newStatus === 'active') {
      await supabase.from('advertisers').update({ status: 'active' }).eq('id', advertiserId)
    }

    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-calm-100">
      {currentStatus === 'pending_review' && (
        <>
          <button
            onClick={() => updateStatus('active')}
            disabled={loading !== null}
            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            {loading === 'active' ? '...' : '✓ Aprobar'}
          </button>
          <button
            onClick={() => updateStatus('rejected')}
            disabled={loading !== null}
            className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            {loading === 'rejected' ? '...' : '✗ Rechazar'}
          </button>
        </>
      )}
      {currentStatus === 'active' && (
        <button
          onClick={() => updateStatus('paused')}
          disabled={loading !== null}
          className="flex-1 py-2 border-2 border-calm-200 text-calm-500 font-bold text-xs rounded-xl hover:border-calm-400 transition-colors disabled:opacity-50"
        >
          {loading === 'paused' ? '...' : 'Pausar'}
        </button>
      )}
      {currentStatus === 'paused' && (
        <button
          onClick={() => updateStatus('active')}
          disabled={loading !== null}
          className="flex-1 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
        >
          {loading === 'active' ? '...' : 'Reactivar'}
        </button>
      )}
    </div>
  )
}
