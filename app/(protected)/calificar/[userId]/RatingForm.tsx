'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Star } from 'lucide-react'

interface RatingFormProps {
  fromUserId: string
  toUserId: string
  toUserName: string
  vehicleId: string
  existingRating?: number
  existingComment?: string
  existingRatingId?: string
}

export function RatingForm({
  fromUserId, toUserId, toUserName, vehicleId,
  existingRating, existingComment, existingRatingId,
}: RatingFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(existingRating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState(existingComment ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError('Seleccioná una calificación del 1 al 7')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (existingRatingId) {
      await supabase
        .from('ratings')
        .update({ rating, comment: comment.trim() || null })
        .eq('id', existingRatingId)
    } else {
      const { error: err } = await supabase.from('ratings').insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        vehicle_id: vehicleId,
        rating,
        comment: comment.trim() || null,
      })
      if (err) {
        setError('Error al guardar la calificación.')
        setLoading(false)
        return
      }
    }

    setLoading(false)
    router.push('/solicitudes')
    router.refresh()
  }

  const display = hovered || rating

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-calm-500 font-semibold mb-4">
          Calificá a <span className="font-extrabold text-calm-800">{toUserName}</span>
        </p>

        {/* 7-star selector */}
        <div className="flex items-center justify-center gap-1.5" role="group" aria-label="Calificación">
          {[1, 2, 3, 4, 5, 6, 7].map(n => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(n)}
              aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
              className="p-0.5 transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                size={32}
                className={`transition-colors ${n <= display ? 'fill-amber-400 text-amber-400' : 'text-calm-200'}`}
              />
            </button>
          ))}
        </div>

        {display > 0 && (
          <p className="mt-3 text-sm font-extrabold text-calm-700">
            {display === 1 ? 'Muy malo' :
             display === 2 ? 'Malo' :
             display === 3 ? 'Regular' :
             display === 4 ? 'Bueno' :
             display === 5 ? 'Muy bueno' :
             display === 6 ? 'Excelente' :
             'Sobresaliente ⭐'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-calm-700 mb-1.5">
          Comentario <span className="text-calm-400 font-normal">(opcional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Contanos tu experiencia de trabajo..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 text-calm-800 text-sm placeholder:text-calm-300 focus:outline-none focus:border-calm-400 transition-colors resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={loading || rating === 0}>
        {loading ? 'Guardando...' : existingRatingId ? 'Actualizar calificación' : 'Enviar calificación'}
      </Button>
    </form>
  )
}
