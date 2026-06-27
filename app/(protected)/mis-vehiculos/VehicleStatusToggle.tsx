'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { VehicleStatus } from '@/types'

interface VehicleStatusToggleProps {
  vehicleId: string
  currentStatus: VehicleStatus
}

const STATUS_OPTIONS: { value: VehicleStatus; label: string; style: string }[] = [
  { value: 'disponible', label: 'Disponible', style: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'pausado', label: 'Pausado', style: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'ocupado', label: 'Ocupado', style: 'bg-gray-100 text-gray-600 border-gray-200' },
]

export function VehicleStatusToggle({ vehicleId, currentStatus }: VehicleStatusToggleProps) {
  const router = useRouter()
  const [status, setStatus] = useState<VehicleStatus>(currentStatus)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function changeStatus(newStatus: VehicleStatus) {
    if (newStatus === status) { setOpen(false); return }
    setLoading(true)
    const supabase = createClient()
    await supabase.from('vehicles').update({ status: newStatus }).eq('id', vehicleId)
    setStatus(newStatus)
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  const current = STATUS_OPTIONS.find(s => s.value === status)!

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all ${current.style}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        {current.label}
        <span className="opacity-60">▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl border border-calm-200 shadow-lg overflow-hidden z-10 min-w-[130px]">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => changeStatus(opt.value)}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-calm-50 transition-colors ${opt.value === status ? 'bg-calm-50' : ''}`}
            >
              <span className={`inline-flex items-center gap-1.5 ${opt.style.split(' ').filter(c => c.startsWith('text-')).join(' ')}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
