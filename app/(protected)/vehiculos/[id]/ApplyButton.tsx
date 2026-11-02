'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { DAYS_OF_WEEK, SCHEDULE_LABELS, LEGAL_DISCLAIMER, type ScheduleType } from '@/types'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ApplyButtonProps {
  vehicleId: string
  driverId: string
  ownerSplit: number
}

const SPLIT_OPTIONS = [50, 55, 60, 65, 70]

export function ApplyButton({ vehicleId, driverId, ownerSplit }: ApplyButtonProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [offeredSplit, setOfferedSplit] = useState<number>(ownerSplit)
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [schedule, setSchedule] = useState<ScheduleType>('completo')
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleDay(day: string) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function handleApply() {
    if (!acceptedDisclaimer) {
      setError('Tenés que aceptar el acuerdo de no relación laboral para continuar.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: dbError } = await supabase.from('applications').insert({
      vehicle_id: vehicleId,
      driver_id: driverId,
      message: message.trim() || null,
      driver_offered_split: offeredSplit,
      driver_available_days: selectedDays,
      driver_schedule: schedule,
      accepted_legal_disclaimer: true,
      status: 'pendiente',
    })

    if (dbError) {
      setError('No se pudo enviar la solicitud. Intentá de nuevo.')
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
    <div className="bg-white rounded-3xl border border-calm-200 p-5 space-y-5">
      <h2 className="font-extrabold text-calm-800 text-lg">Enviar solicitud</h2>

      {/* Percentage offer */}
      <div>
        <p id="split-label" className="block font-bold text-calm-700 text-sm mb-2">
          Tu oferta de porcentaje
        </p>
        <p id="split-help" className="text-xs text-calm-500 mb-3">
          El propietario ofrece {ownerSplit}% para el conductor. Podés aceptar o hacer una contraoferta.
        </p>
        <div className="flex gap-2 flex-wrap" role="group" aria-labelledby="split-label" aria-describedby="split-help">
          {SPLIT_OPTIONS.map(pct => (
            <button
              key={pct}
              type="button"
              onClick={() => setOfferedSplit(pct)}
              aria-pressed={offeredSplit === pct}
              className={`px-4 py-2 rounded-xl font-extrabold text-sm transition-colors ${
                offeredSplit === pct
                  ? 'bg-calm-500 text-white'
                  : 'bg-calm-50 text-calm-600 hover:bg-calm-100'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
        <p className="text-xs text-calm-500 mt-2 font-semibold" aria-live="polite">
          Con tu oferta: {offeredSplit}% para vos · {100 - offeredSplit}% para el propietario
        </p>
      </div>

      {/* Schedule */}
      <div>
        <p id="apply-schedule-label" className="block font-bold text-calm-700 text-sm mb-2">
          Modalidad de trabajo
        </p>
        <div className="flex gap-2 flex-wrap" role="group" aria-labelledby="apply-schedule-label">
          {(Object.entries(SCHEDULE_LABELS) as [ScheduleType, string][]).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setSchedule(val)}
              aria-pressed={schedule === val}
              className={`px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                schedule === val
                  ? 'bg-calm-500 text-white'
                  : 'bg-calm-50 text-calm-600 hover:bg-calm-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Available days */}
      <div>
        <p id="apply-days-label" className="block font-bold text-calm-700 text-sm mb-2">
          Días disponibles
        </p>
        <div className="flex gap-1.5 flex-wrap" role="group" aria-labelledby="apply-days-label">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              aria-pressed={selectedDays.includes(day.value)}
              className={`w-10 h-10 rounded-xl font-bold text-xs transition-colors ${
                selectedDays.includes(day.value)
                  ? 'bg-calm-500 text-white'
                  : 'bg-calm-50 text-calm-600 hover:bg-calm-100'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        {selectedDays.length === 0 && (
          <p className="text-xs text-calm-500 mt-1.5">Seleccioná al menos un día</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="apply-message" className="block font-bold text-calm-700 text-sm mb-2">
          Presentación (opcional)
        </label>
        <textarea
          id="apply-message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Presentate al propietario: experiencia, referencias, por qué sos el conductor ideal..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 bg-white text-calm-800 font-medium placeholder:text-calm-400 focus:outline-none focus:border-calm-500 focus:ring-2 focus:ring-calm-500/30 transition-colors text-sm resize-none"
        />
      </div>

      {/* Legal disclaimer */}
      <div className="rounded-2xl border-2 border-calm-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDisclaimer(v => !v)}
          aria-expanded={showDisclaimer}
          aria-controls="legal-disclaimer"
          className="w-full flex items-center justify-between p-4 text-left hover:bg-calm-50 transition-colors"
        >
          <span className="font-bold text-calm-700 text-sm">
            Acuerdo de alquiler — no relación laboral
          </span>
          {showDisclaimer ? <ChevronUp size={16} className="text-calm-400" aria-hidden="true" /> : <ChevronDown size={16} className="text-calm-400" aria-hidden="true" />}
        </button>

        {showDisclaimer && (
          <div className="px-4 pb-4" id="legal-disclaimer">
            <pre tabIndex={0} aria-label="Texto completo del acuerdo" className="text-xs text-calm-500 whitespace-pre-wrap leading-relaxed font-sans bg-calm-50 rounded-xl p-3 max-h-48 overflow-y-auto">
              {LEGAL_DISCLAIMER}
            </pre>
          </div>
        )}

        <label className="flex items-start gap-3 px-4 pb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedDisclaimer}
            onChange={e => setAcceptedDisclaimer(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-calm-500 shrink-0"
          />
          <span className="text-xs text-calm-600 font-semibold leading-snug">
            Leí y acepto que esta es una relación de alquiler de vehículo, no laboral ni de dependencia.
          </span>
        </label>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowForm(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button
          size="md"
          className="flex-1"
          onClick={handleApply}
          disabled={loading || !acceptedDisclaimer}
        >
          {loading ? 'Enviando...' : 'Enviar solicitud'}
        </Button>
      </div>
    </div>
  )
}
