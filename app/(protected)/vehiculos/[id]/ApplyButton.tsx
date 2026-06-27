'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface ApplyButtonProps {
  vehicleId: string
  driverId: string
}

export function ApplyButton({ vehicleId, driverId }: ApplyButtonProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function handleApply() {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.from('applications').insert({
      vehicle_id: vehicleId,
      driver_id: driverId,
      message: message.trim() || null,
      status: 'pendiente',
    })

    if (error) {
      setError('No se pudo enviar la solicitud. Intenta de nuevo.')
      setLoading(false)
      return
    }

    router.refresh()
  }

  if (!showForm) {
    return (
      <Button size="lg" className="w-full" onClick={() => setShowForm(true)}>
        Enviar solicitud
      </Button>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-calm-200 p-5 space-y-4">
      <h3 className="font-extrabold text-calm-800 text-lg">Enviar solicitud</h3>
      <p className="text-sm text-calm-500">
        Preséntate al propietario. Cuéntale tu experiencia, disponibilidad y por qué eres el conductor ideal.
      </p>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Hola, soy conductor con X años de experiencia en plataformas. Estoy disponible para..."
        rows={5}
        className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 bg-white text-calm-800 font-medium placeholder:text-calm-300 focus:outline-none focus:border-calm-400 transition-colors text-sm resize-none"
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowForm(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button size="md" className="flex-1" onClick={handleApply} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar solicitud'}
        </Button>
      </div>
    </div>
  )
}
