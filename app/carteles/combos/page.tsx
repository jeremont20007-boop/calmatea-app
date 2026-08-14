import type { Metadata } from 'next'
import { COMERCIO, formatARS } from '@/lib/sorteo/config'
import {
  COMBOS,
  STOCK_LIMITADO,
  diasHasta,
  estadoCombo,
  formatFechaCorta,
  type EstadoCombo,
} from '@/lib/combos/config'

export const metadata: Metadata = {
  title: `Planilla de combos | ${COMERCIO.nombre}`,
  robots: { index: false },
}

/** Se calcula contra el día real, así la planilla marca lo vencido al imprimirla. */
export const dynamic = 'force-dynamic'

const ESTADO_ESTILO: Record<EstadoCombo, { fila: string; chip: string; texto: string }> = {
  vigente:    { fila: '', chip: 'bg-emerald-100 text-emerald-900', texto: 'Vigente' },
  por_vencer: { fila: 'bg-amber-50', chip: 'bg-amber-300 text-amber-950', texto: 'Vence ya' },
  vencido:    { fila: 'opacity-40 line-through', chip: 'bg-stone-200 text-stone-600', texto: 'Vencido' },
  no_empezo:  { fila: 'opacity-60', chip: 'bg-stone-200 text-stone-600', texto: 'No empezó' },
}

export default function PlanillaCombosPage() {
  const hoy = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  })

  // Primero lo que se vence antes: es lo que hay que empujar y lo que hay que despegar.
  const combos = [...COMBOS]
    .map(c => ({ ...c, estado: estadoCombo(c, hoy), dias: diasHasta(c.hasta, hoy) }))
    .sort((a, b) => a.hasta.localeCompare(b.hasta))

  const vencidos = combos.filter(c => c.estado === 'vencido')

  return (
    <main className="min-h-screen bg-stone-100 print:bg-white">
      <div className="print:hidden max-w-[297mm] mx-auto px-5 pt-8">
        <div className="p-4 rounded-2xl bg-white border-2 border-stone-200">
          <p className="font-extrabold text-stone-800">Planilla de combos para la caja</p>
          <p className="mt-1 text-sm text-stone-600">
            Imprimila y pegala en la caja. Los combos y las fechas se editan en{' '}
            <code>lib/combos/config.ts</code>; cuando Coca-Cola manda afiches nuevos se
            actualiza ahí y se reimprime. Lo vencido aparece tachado según la fecha del día
            en que imprimís.
          </p>
          {vencidos.length > 0 && (
            <p className="mt-3 p-3 rounded-xl bg-red-50 border-2 border-red-200 text-sm font-bold text-red-700">
              Hay {vencidos.length} combo{vencidos.length > 1 ? 's' : ''} vencido
              {vencidos.length > 1 ? 's' : ''}: despegá {vencidos.length > 1 ? 'esos afiches' : 'ese afiche'} de
              la pared y sacá {vencidos.length > 1 ? 'las filas' : 'la fila'} de la lista.
            </p>
          )}
        </div>
      </div>

      {/* ── Hoja A4 apaisada ── */}
      <div
        className="max-w-[297mm] mx-auto my-8 print:my-0 bg-white
                   px-10 py-8 print:px-8 print:py-6
                   border-2 border-stone-200 print:border-0"
      >
        <header className="flex items-end justify-between gap-4 pb-4 border-b-4 border-stone-900">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900 leading-none">
              Combos Digitales Coca-Cola
            </h1>
            <p className="mt-1.5 text-base text-stone-600">
              El cliente escanea el QR, genera el código y te lo entrega. Vos cobrás el
              precio de esta lista.
            </p>
          </div>
          <p className="text-sm text-stone-500 whitespace-nowrap font-mono">
            Al {formatFechaCorta(hoy)}
          </p>
        </header>

        <table className="w-full mt-5 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-stone-500">
              <th className="pb-2 font-bold">Combo</th>
              <th className="pb-2 font-bold">Qué incluye</th>
              <th className="pb-2 font-bold text-right">Cobrás</th>
              <th className="pb-2 font-bold text-center">Envase</th>
              <th className="pb-2 font-bold text-right">Hasta</th>
            </tr>
          </thead>
          <tbody>
            {combos.map(c => {
              const est = ESTADO_ESTILO[c.estado]
              return (
                <tr
                  key={c.nombre}
                  className={`border-b border-stone-200 align-middle ${est.fila}`}
                >
                  <td className="py-3 pr-3">
                    <span className="block font-extrabold text-stone-900 text-lg leading-tight">
                      {c.nombre}
                    </span>
                    {c.descuento && (
                      <span className="block text-sm text-stone-500">{c.descuento}</span>
                    )}
                  </td>

                  <td className="py-3 pr-3 text-sm text-stone-700 leading-snug">
                    {c.detalle}
                    {c.stock <= STOCK_LIMITADO && (
                      <span className="block text-xs font-bold text-amber-700 mt-0.5">
                        Stock corto ({c.stock}) — se puede agotar
                      </span>
                    )}
                  </td>

                  <td className="py-3 pr-3 text-right">
                    <span className="font-extrabold text-2xl text-stone-900 tabular-nums">
                      {formatARS(c.precio)}
                    </span>
                  </td>

                  <td className="py-3 pr-3 text-center">
                    {c.retornable ? (
                      <span className="inline-block px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-extrabold uppercase tracking-wide">
                        Retornable
                      </span>
                    ) : (
                      <span className="text-stone-300 text-lg">—</span>
                    )}
                  </td>

                  <td className="py-3 text-right whitespace-nowrap">
                    <span className="block font-bold text-stone-800 tabular-nums">
                      {formatFechaCorta(c.hasta)}
                    </span>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-extrabold ${est.chip}`}
                    >
                      {c.estado === 'vigente' || c.estado === 'por_vencer'
                        ? `Quedan ${c.dias} días`
                        : est.texto}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* ── Recordatorios ── */}
        <section className="mt-6 grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300">
            <p className="font-extrabold text-red-900 text-sm">Si dice RETORNABLE</p>
            <p className="mt-1 text-sm text-stone-700 leading-snug">
              Preguntá <strong>antes de cobrar</strong>: «¿trajiste los envases?». Si no los
              trae, el envase se cobra aparte.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-100 border-2 border-stone-300">
            <p className="font-extrabold text-stone-900 text-sm">Si el código no anda</p>
            <p className="mt-1 text-sm text-stone-700 leading-snug">
              Fijate que lo que trae sea <strong>exactamente</strong> lo de la columna «qué
              incluye». Si el combo venció o se agotó, ofrecele otro.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-100 border-2 border-stone-300">
            <p className="font-extrabold text-stone-900 text-sm">Nunca</p>
            <p className="mt-1 text-sm text-stone-700 leading-snug">
              Le negues el descuento por no darte el WhatsApp. El descuento es de Coca-Cola
              y es del cliente.
            </p>
          </div>
        </section>

        <p className="mt-5 text-xs text-stone-400">
          {COMERCIO.nombre} · Los precios los fija Coca-Cola. Si un combo no figura en esta
          lista, no lo apliques: consultá antes.
        </p>
      </div>
    </main>
  )
}
