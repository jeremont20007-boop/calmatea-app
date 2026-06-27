'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TopBar } from '@/components/layout/TopBar'
import {
  PLATFORM_LABELS, VEHICLE_TYPE_LABELS, DAYS_OF_WEEK,
  type PlatformType, type ScheduleType, type VehicleType,
} from '@/types'

const PLATFORMS: PlatformType[] = ['uber', 'cabify', 'beat', 'indrive', 'didi', 'otra']
const SCHEDULES: { value: ScheduleType; label: string }[] = [
  { value: 'completo', label: 'Tiempo completo (lun–dom)' },
  { value: 'parcial', label: 'Tiempo parcial' },
  { value: 'fines_de_semana', label: 'Fines de semana' },
]
const VEHICLE_TYPES: { value: VehicleType; label: string; sub: string }[] = [
  { value: 'remis', label: 'Remis', sub: 'Habilitado como remis' },
  { value: 'taxi', label: 'Taxi', sub: 'Con licencia de taxi' },
  { value: 'plataforma', label: 'Solo plataforma digital', sub: 'Uber/Cabify/Beat/etc.' },
]

function DaySelector({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (days: string[]) => void
}) {
  function toggle(day: string) {
    onChange(selected.includes(day) ? selected.filter(d => d !== day) : [...selected, day])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS_OF_WEEK.map(d => (
        <button
          key={d.value}
          type="button"
          onClick={() => toggle(d.value)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all min-w-[44px] ${
            selected.includes(d.value)
              ? 'bg-calm-500 text-white border-calm-500'
              : 'bg-white text-calm-400 border-calm-200 hover:border-calm-400'
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
}

export default function NuevoVehiculoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Basic info
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [color, setColor] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [city, setCity] = useState('Neuquén')

  // Classification
  const [vehicleType, setVehicleType] = useState<VehicleType>('plataforma')
  const [isInRemisBase, setIsInRemisBase] = useState(false)
  const [remisBaseName, setRemisBaseName] = useState('')
  const [neuquenOnly, setNeuquenOnly] = useState(false)

  // Platforms & schedule
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([])
  const [schedule, setSchedule] = useState<ScheduleType>('completo')

  // Rental availability
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [availableHours, setAvailableHours] = useState('')

  // Revenue split = % conductor earns
  const [revenueSplit, setRevenueSplit] = useState('60')

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
    if (isNaN(yearNum) || yearNum < 2010 || yearNum > 2026) {
      setError('Ingresa un año válido (2010–2026)')
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
      setError('No se encontró tu perfil.')
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
      vehicle_type: vehicleType,
      is_in_remis_base: isInRemisBase,
      remis_base_name: isInRemisBase ? remisBaseName.trim() || null : null,
      neuquen_only: neuquenOnly,
      platforms: selectedPlatforms,
      schedule,
      available_days: availableDays,
      available_hours: availableHours.trim() || null,
      revenue_split: splitNum,
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

  const conductorKeeps = parseInt(revenueSplit) || 60
  const ownerKeeps = 100 - conductorKeeps

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Publicar vehículo" showBack backHref="/mis-vehiculos" />

      <form onSubmit={handleSubmit} className="p-4 space-y-5 pb-8 max-w-lg mx-auto w-full">

        {/* ── Datos del vehículo ── */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <h2 className="font-extrabold text-calm-800 text-lg">🚗 Datos del vehículo</h2>

          <div className="grid grid-cols-2 gap-3">
            <Input id="make" label="Marca" placeholder="Toyota" value={make} onChange={e => setMake(e.target.value)} required />
            <Input id="model" label="Modelo" placeholder="Corolla" value={model} onChange={e => setModel(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="year" label="Año" placeholder="2022" type="number" value={year} onChange={e => setYear(e.target.value)} required min="2010" max="2026" />
            <Input id="color" label="Color" placeholder="Blanco" value={color} onChange={e => setColor(e.target.value)} required />
          </div>
          <Input id="licensePlate" label="Patente" placeholder="ABC123" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} required />
          <Input id="city" label="Ciudad" placeholder="Neuquén" value={city} onChange={e => setCity(e.target.value)} required />
        </section>

        {/* ── Tipo de vehículo ── */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <h2 className="font-extrabold text-calm-800 text-lg">📋 Tipo de habilitación</h2>

          <div className="space-y-2">
            {VEHICLE_TYPES.map(vt => (
              <label
                key={vt.value}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  vehicleType === vt.value
                    ? 'border-calm-500 bg-calm-50'
                    : 'border-calm-100 hover:border-calm-300'
                }`}
              >
                <input
                  type="radio"
                  name="vehicleType"
                  value={vt.value}
                  checked={vehicleType === vt.value}
                  onChange={() => setVehicleType(vt.value)}
                  className="accent-calm-500"
                />
                <div>
                  <p className="font-extrabold text-calm-800 text-sm">{vt.label}</p>
                  <p className="text-xs text-calm-400">{vt.sub}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Remis-specific fields */}
          {(vehicleType === 'remis') && (
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-3 p-3 rounded-2xl border-2 border-calm-100 cursor-pointer hover:border-calm-300 transition-colors">
                <input
                  type="checkbox"
                  checked={isInRemisBase}
                  onChange={e => setIsInRemisBase(e.target.checked)}
                  className="accent-calm-500 w-4 h-4"
                />
                <div>
                  <p className="font-bold text-calm-800 text-sm">¿Pertenece a una base de remis?</p>
                  <p className="text-xs text-calm-400">El conductor deberá reportarse a la base</p>
                </div>
              </label>
              {isInRemisBase && (
                <Input
                  id="remisBaseName"
                  label="Nombre de la base"
                  placeholder="Remis Centenario, Base Sur..."
                  value={remisBaseName}
                  onChange={e => setRemisBaseName(e.target.value)}
                />
              )}
            </div>
          )}

          {/* Platform-only: Neuquén flag */}
          {(vehicleType === 'plataforma' || vehicleType === 'remis') && (
            <label className="flex items-center gap-3 p-3 rounded-2xl border-2 border-calm-100 cursor-pointer hover:border-calm-300 transition-colors">
              <input
                type="checkbox"
                checked={neuquenOnly}
                onChange={e => setNeuquenOnly(e.target.checked)}
                className="accent-calm-500 w-4 h-4"
              />
              <div>
                <p className="font-bold text-calm-800 text-sm">Habilitación solo en Neuquén</p>
                <p className="text-xs text-calm-400">La plataforma solo está activa en la ciudad de Neuquén</p>
              </div>
            </label>
          )}
        </section>

        {/* ── Plataformas ── */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-3">
          <h2 className="font-extrabold text-calm-800 text-lg">📱 Plataformas activas</h2>
          <p className="text-xs text-calm-400">Selecciona en qué plataformas está registrado el vehículo</p>
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
        </section>

        {/* ── Disponibilidad del propietario para alquilar ── */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <h2 className="font-extrabold text-calm-800 text-lg">📅 Disponibilidad para alquiler</h2>
          <p className="text-xs text-calm-400">
            ¿Qué días y horarios puede el conductor usar el vehículo?
          </p>

          <div>
            <p className="text-sm font-semibold text-calm-700 mb-2">Días disponibles</p>
            <DaySelector selected={availableDays} onChange={setAvailableDays} />
            <p className="text-xs text-calm-400 mt-2">
              Sin selección = flexible / a coordinar con el conductor
            </p>
          </div>

          <Input
            id="availableHours"
            label="Horario (opcional)"
            placeholder="8:00 a 22:00 · O por turno"
            value={availableHours}
            onChange={e => setAvailableHours(e.target.value)}
          />

          <div>
            <p className="text-sm font-semibold text-calm-700 mb-2">Régimen de trabajo</p>
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
        </section>

        {/* ── Porcentaje ofertado ── */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <h2 className="font-extrabold text-calm-800 text-lg">💰 Porcentaje ofertado</h2>
          <p className="text-xs text-calm-400">
            Define qué porcentaje de las ganancias de la plataforma recibirá el conductor. El conductor también puede contra-ofertar al enviar su solicitud.
          </p>

          <div className="bg-calm-50 rounded-2xl p-4 grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-3xl font-extrabold text-forest">{conductorKeeps}%</p>
              <p className="text-xs text-calm-500 font-semibold mt-1">para el conductor</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-calm-500">{ownerKeeps}%</p>
              <p className="text-xs text-calm-500 font-semibold mt-1">para ti (propietario)</p>
            </div>
          </div>

          <input
            type="range"
            min="40"
            max="90"
            step="5"
            value={revenueSplit}
            onChange={e => setRevenueSplit(e.target.value)}
            className="w-full accent-calm-500"
          />
          <div className="flex justify-between text-xs text-calm-400">
            <span>Conductor 40% / Tú 60%</span>
            <span>Conductor 90% / Tú 10%</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[50, 55, 60, 65, 70].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setRevenueSplit(String(v))}
                className={`py-2 rounded-xl text-xs font-extrabold border-2 transition-all ${
                  revenueSplit === String(v)
                    ? 'bg-calm-500 text-white border-calm-500'
                    : 'border-calm-200 text-calm-500 hover:border-calm-400'
                }`}
              >
                {v}%
              </button>
            ))}
          </div>
        </section>

        {/* ── Descripción ── */}
        <section className="bg-white rounded-3xl p-5 border border-calm-100 space-y-3">
          <h2 className="font-extrabold text-calm-800 text-lg">
            📝 Descripción <span className="text-calm-400 font-normal text-sm">(opcional)</span>
          </h2>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Estado del vehículo, condiciones del acuerdo, requisitos para el conductor, información adicional sobre la base o plataforma..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 bg-white text-calm-800 font-medium placeholder:text-calm-300 focus:outline-none focus:border-calm-400 transition-colors text-sm resize-none"
          />
        </section>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Publicando...' : 'Publicar vehículo'}
        </Button>

        <p className="text-xs text-calm-400 text-center px-4">
          Después de publicar podrás subir los documentos del vehículo desde "Mis Vehículos".
        </p>
      </form>
    </div>
  )
}
