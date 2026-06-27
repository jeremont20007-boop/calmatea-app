'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TopBar } from '@/components/layout/TopBar'
import { PLATFORM_LABELS, type PlatformType, type ScheduleType } from '@/types'

const PLATFORMS: PlatformType[] = ['uber', 'cabify', 'beat', 'indrive', 'didi', 'otra']
const SCHEDULES: { value: ScheduleType; label: string }[] = [
  { value: 'completo', label: 'Tiempo completo (lun–dom)' },
  { value: 'parcial', label: 'Tiempo parcial' },
  { value: 'fines_de_semana', label: 'Fines de semana' },
]

export default function NuevoVehiculoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [color, setColor] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [city, setCity] = useState('')
  const [revenueSplit, setRevenueSplit] = useState('60')
  const [schedule, setSchedule] = useState<ScheduleType>('completo')
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([])
  const [description, setDescription] = useState('')

  function togglePlatform(p: PlatformType) {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (selectedPlatforms.length === 0) {
      setError('Selecciona al menos una plataforma')
      return
    }

    const yearNum = parseInt(year)
    if (isNaN(yearNum) || yearNum < 2015 || yearNum > 2026) {
      setError('Ingresa un año válido (2015–2026)')
      return
    }

    const splitNum = parseInt(revenueSplit)
    if (isNaN(splitNum) || splitNum < 40 || splitNum > 90) {
      setError('El porcentaje para el conductor debe estar entre 40% y 90%')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      setError('No se encontró tu perfil. Intenta de nuevo.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('vehicles').insert({
      owner_id: profile.id,
      make: make.trim(),
      model: model.trim(),
      year: yearNum,
      color: color.trim(),
      license_plate: licensePlate.trim().toUpperCase(),
      city: city.trim(),
      revenue_split: splitNum,
      schedule,
      platforms: selectedPlatforms,
      description: description.trim() || null,
      status: 'disponible',
    })

    if (insertError) {
      setError('Error al publicar el vehículo. Intenta de nuevo.')
      setLoading(false)
      return
    }

    router.push('/mis-vehiculos')
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Publicar vehículo" showBack backHref="/mis-vehiculos" />

      <form onSubmit={handleSubmit} className="p-4 space-y-5 pb-8 max-w-lg mx-auto w-full">

        {/* Vehicle info */}
        <div className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <h2 className="font-extrabold text-calm-800 text-lg">Datos del vehículo</h2>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="make"
              label="Marca"
              placeholder="Toyota"
              value={make}
              onChange={e => setMake(e.target.value)}
              required
            />
            <Input
              id="model"
              label="Modelo"
              placeholder="Corolla"
              value={model}
              onChange={e => setModel(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="year"
              label="Año"
              placeholder="2022"
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              required
              min="2015"
              max="2026"
            />
            <Input
              id="color"
              label="Color"
              placeholder="Blanco"
              value={color}
              onChange={e => setColor(e.target.value)}
              required
            />
          </div>

          <Input
            id="licensePlate"
            label="Placa"
            placeholder="ABC-1234"
            value={licensePlate}
            onChange={e => setLicensePlate(e.target.value)}
            required
          />

          <Input
            id="city"
            label="Ciudad"
            placeholder="Ciudad de México"
            value={city}
            onChange={e => setCity(e.target.value)}
            required
          />
        </div>

        {/* Platforms */}
        <div className="bg-white rounded-3xl p-5 border border-calm-100 space-y-3">
          <h2 className="font-extrabold text-calm-800 text-lg">Plataformas activas</h2>
          <p className="text-sm text-calm-400">Selecciona en qué plataformas está registrado tu vehículo</p>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`py-2.5 px-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  selectedPlatforms.includes(p)
                    ? 'bg-calm-500 text-white border-calm-500'
                    : 'bg-white text-calm-500 border-calm-200 hover:border-calm-400'
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule & Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <h2 className="font-extrabold text-calm-800 text-lg">Condiciones para el conductor</h2>

          <div>
            <label className="block text-sm font-semibold text-calm-700 mb-2">
              Horario de trabajo
            </label>
            <div className="space-y-2">
              {SCHEDULES.map(s => (
                <label
                  key={s.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    schedule === s.value
                      ? 'border-calm-500 bg-calm-50'
                      : 'border-calm-100 hover:border-calm-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="schedule"
                    value={s.value}
                    checked={schedule === s.value}
                    onChange={() => setSchedule(s.value)}
                    className="accent-calm-500"
                  />
                  <span className="font-semibold text-sm text-calm-700">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-calm-700 mb-2">
              Porcentaje para el conductor: <span className="text-forest font-extrabold text-lg">{revenueSplit}%</span>
            </label>
            <input
              type="range"
              min="40"
              max="90"
              step="5"
              value={revenueSplit}
              onChange={e => setRevenueSplit(e.target.value)}
              className="w-full accent-calm-500"
            />
            <div className="flex justify-between text-xs text-calm-400 mt-1">
              <span>40% (min)</span>
              <span>Propietario recibe {100 - parseInt(revenueSplit)}%</span>
              <span>90% (max)</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-3xl p-5 border border-calm-100 space-y-3">
          <h2 className="font-extrabold text-calm-800 text-lg">Descripción <span className="text-calm-400 font-normal text-sm">(opcional)</span></h2>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe las condiciones, el estado del vehículo, requisitos para el conductor, etc."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 bg-white text-calm-800 font-medium placeholder:text-calm-300 focus:outline-none focus:border-calm-400 transition-colors text-sm resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Publicando...' : 'Publicar vehículo'}
        </Button>
      </form>
    </div>
  )
}
