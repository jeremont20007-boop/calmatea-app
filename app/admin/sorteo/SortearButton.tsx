'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FECHAS, formatFechaLarga } from '@/lib/sorteo/config'

export function SortearButton({ habilitado }: { habilitado: boolean }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sortear() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/sorteo/sortear', { method: 'POST' })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'No pudimos realizar el sorteo.')
      setLoading(false)
      setConfirmando(false)
      return
    }

    router.refresh()
  }

  if (!habilitado) {
    return (
      <p className="text-sm text-stone-500">
        Todavía no hay participantes suficientes para sortear.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {!confirmando ? (
        <button
          onClick={() => setConfirmando(true)}
          className="w-full min-h-[56px] rounded-2xl bg-red-600 text-white font-extrabold
                     shadow-lg transition-transform active:scale-95 hover:bg-red-700"
        >
          Realizar el sorteo
        </button>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
          <p className="text-sm font-bold text-stone-800">
            El sorteo se hace una sola vez y queda registrado.
          </p>
          <p className="text-sm text-stone-600">
            Según las bases, la fecha prevista es el {formatFechaLarga(FECHAS.sorteo)} y se
            transmite en vivo. Asegurate de estar al aire antes de confirmar.
          </p>
          <div className="flex gap-2">
            <button
              onClick={sortear}
              disabled={loading}
              className="flex-1 min-h-[52px] rounded-2xl bg-red-600 text-white font-extrabold
                         transition-transform active:scale-95 hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Sorteando...' : 'Sí, sortear ahora'}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              disabled={loading}
              className="px-5 min-h-[52px] rounded-2xl bg-white border-2 border-stone-200
                         font-bold text-stone-700 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
