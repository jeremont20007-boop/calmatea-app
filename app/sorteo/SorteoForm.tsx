'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BARRIOS, ORIGENES, PROMO, formatARS } from '@/lib/sorteo/config'

type Modalidad = 'con_compra' | 'sin_compra'

const labelCls = 'block text-sm font-bold text-stone-700 mb-1.5'
const inputCls =
  'w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-800 font-medium ' +
  'placeholder:text-stone-300 focus:outline-none focus:border-red-500 transition-colors ' +
  'min-h-[52px] text-base'

export function SorteoForm() {
  const router = useRouter()

  const [modalidad, setModalidad] = useState<Modalidad>('con_compra')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [barrio, setBarrio] = useState('')
  const [ticketNumero, setTicketNumero] = useState('')
  const [montoCompra, setMontoCompra] = useState('')
  const [origen, setOrigen] = useState('')
  const [aceptaBases, setAceptaBases] = useState(false)
  const [aceptaNovedades, setAceptaNovedades] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/sorteo/participar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        telefono,
        barrio: barrio || null,
        modalidad,
        ticketNumero: modalidad === 'con_compra' ? ticketNumero : null,
        montoCompra: modalidad === 'con_compra' ? Number(montoCompra) : null,
        origen: origen || null,
        aceptaBases,
        aceptaNovedades,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'No pudimos guardar tu participación. Probá de nuevo.')
      setLoading(false)
      return
    }

    router.push('/sorteo/gracias')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Modalidad ── */}
      <div className="space-y-2">
        <p className={labelCls}>¿Cómo querés participar?</p>

        <label
          className={`flex gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            modalidad === 'con_compra'
              ? 'border-red-500 bg-red-50'
              : 'border-stone-200 hover:border-stone-300'
          }`}
        >
          <input
            type="radio"
            name="modalidad"
            checked={modalidad === 'con_compra'}
            onChange={() => setModalidad('con_compra')}
            className="accent-red-600 mt-0.5"
          />
          <span>
            <span className="block font-extrabold text-stone-800 text-sm">
              Con mi compra de {formatARS(PROMO.compraMinima)} o más
            </span>
            <span className="block text-xs text-stone-500 mt-0.5">
              Te llevás {PROMO.regalo} de regalo y entrás al sorteo.
            </span>
          </span>
        </label>

        <label
          className={`flex gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            modalidad === 'sin_compra'
              ? 'border-red-500 bg-red-50'
              : 'border-stone-200 hover:border-stone-300'
          }`}
        >
          <input
            type="radio"
            name="modalidad"
            checked={modalidad === 'sin_compra'}
            onChange={() => setModalidad('sin_compra')}
            className="accent-red-600 mt-0.5"
          />
          <span>
            <span className="block font-extrabold text-stone-800 text-sm">
              Sin comprar nada
            </span>
            <span className="block text-xs text-stone-500 mt-0.5">
              Entrás al sorteo igual, pero sin el regalo. Una participación por persona.
            </span>
          </span>
        </label>
      </div>

      {/* ── Datos personales ── */}
      <div>
        <label htmlFor="nombre" className={labelCls}>Nombre y apellido</label>
        <input
          id="nombre"
          className={inputCls}
          placeholder="María González"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          autoComplete="name"
          required
        />
      </div>

      <div>
        <label htmlFor="telefono" className={labelCls}>WhatsApp</label>
        <input
          id="telefono"
          className={inputCls}
          placeholder="299 412-3456"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
        />
        <p className="mt-1 text-xs text-stone-400">
          Es el número por el que te avisamos si ganás. Con código de área, sin 0 ni 15.
        </p>
      </div>

      <div>
        <label htmlFor="barrio" className={labelCls}>Barrio</label>
        <select
          id="barrio"
          className={inputCls}
          value={barrio}
          onChange={e => setBarrio(e.target.value)}
        >
          <option value="">Elegí tu barrio</option>
          {BARRIOS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* ── Datos de la compra ── */}
      {modalidad === 'con_compra' && (
        <div className="space-y-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
          <p className="font-extrabold text-stone-800 text-sm">Datos de tu compra</p>

          <div>
            <label htmlFor="ticketNumero" className={labelCls}>Número de ticket</label>
            <input
              id="ticketNumero"
              className={inputCls}
              placeholder="0001-00042317"
              value={ticketNumero}
              onChange={e => setTicketNumero(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-stone-500">
              Está impreso en tu comprobante. Cada ticket participa una sola vez.
            </p>
          </div>

          <div>
            <label htmlFor="montoCompra" className={labelCls}>Monto total</label>
            <input
              id="montoCompra"
              className={inputCls}
              placeholder={String(PROMO.compraMinima)}
              value={montoCompra}
              onChange={e => setMontoCompra(e.target.value)}
              type="number"
              inputMode="numeric"
              min={PROMO.compraMinima}
              step="1"
              required
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="origen" className={labelCls}>
          ¿Cómo te enteraste? <span className="font-normal text-stone-400">(opcional)</span>
        </label>
        <select
          id="origen"
          className={inputCls}
          value={origen}
          onChange={e => setOrigen(e.target.value)}
        >
          <option value="">Elegí una opción</option>
          {ORIGENES.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Consentimientos ── */}
      <div className="space-y-2.5">
        <label className="flex gap-3 items-start cursor-pointer">
          <input
            type="checkbox"
            checked={aceptaBases}
            onChange={e => setAceptaBases(e.target.checked)}
            className="accent-red-600 w-5 h-5 mt-0.5 shrink-0"
            required
          />
          <span className="text-sm text-stone-600">
            Acepto las{' '}
            <Link href="/sorteo/bases" className="text-red-700 font-bold underline" target="_blank">
              bases y condiciones
            </Link>{' '}
            del sorteo.
          </span>
        </label>

        <label className="flex gap-3 items-start cursor-pointer">
          <input
            type="checkbox"
            checked={aceptaNovedades}
            onChange={e => setAceptaNovedades(e.target.checked)}
            className="accent-red-600 w-5 h-5 mt-0.5 shrink-0"
          />
          <span className="text-sm text-stone-600">
            Quiero recibir las ofertas de la semana por WhatsApp. Podés darte de baja cuando quieras.
          </span>
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-semibold"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[60px] rounded-2xl bg-red-600 text-white text-lg font-extrabold
                   shadow-lg transition-all active:scale-95 hover:bg-red-700
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Guardando...' : 'Participar del sorteo'}
      </button>
    </form>
  )
}
