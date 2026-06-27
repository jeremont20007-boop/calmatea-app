'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function withdraw() {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('applications')
      .update({ status: 'retirada' })
      .eq('id', applicationId)
    setLoading(false)
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex gap-2 items-center pt-2 border-t border-calm-100">
        <p className="text-xs text-calm-500 font-semibold flex-1">¿Retirar solicitud?</p>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-bold text-calm-400 px-3 py-1.5 rounded-lg hover:bg-calm-100 transition-colors"
        >
          No
        </button>
        <button
          onClick={withdraw}
          disabled={loading}
          className="text-xs font-bold text-red-600 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
        >
          {loading ? 'Retirando...' : 'Sí, retirar'}
        </button>
      </div>
    )
  }

  return (
    <div className="pt-2 border-t border-calm-100">
      <button
        onClick={() => setConfirming(true)}
        className="text-xs font-semibold text-calm-400 hover:text-red-500 transition-colors"
      >
        Retirar solicitud
      </button>
    </div>
  )
}
