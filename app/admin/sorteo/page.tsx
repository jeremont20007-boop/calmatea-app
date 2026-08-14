import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { esAdmin } from '@/lib/sorteo/auth'
import { formatearTelefono } from '@/lib/sorteo/validacion'
import { ORIGENES, PROMO, formatARS } from '@/lib/sorteo/config'
import { SortearButton } from './SortearButton'

export const metadata: Metadata = {
  title: 'Sorteo · Panel',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

const ORIGEN_LABEL = Object.fromEntries(ORIGENES.map(o => [o.value, o.label]))

type Participante = {
  id: string
  nombre: string
  telefono: string
  barrio: string | null
  modalidad: 'con_compra' | 'sin_compra'
  monto_compra: number | null
  chances: number
  origen: string | null
  acepta_novedades: boolean
  created_at: string
}

type Ganador = {
  puesto: number
  premio_monto: number
  seed: string
  total_chances: number
  sorteado_at: string
  sorteo_participantes: { nombre: string; telefono: string } | null
}

function Kpi({ valor, etiqueta, detalle }: { valor: string; etiqueta: string; detalle?: string }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-stone-200 p-4">
      <p className="text-2xl font-extrabold text-stone-800">{valor}</p>
      <p className="text-xs font-bold text-stone-500 mt-0.5 leading-tight">{etiqueta}</p>
      {detalle && <p className="text-[11px] text-stone-400 mt-1">{detalle}</p>}
    </div>
  )
}

export default async function AdminSorteoPage() {
  if (!(await esAdmin())) redirect('/auth/login')

  const supabase = createAdminClient()

  const [{ data: participantesRaw }, { data: ganadoresRaw }] = await Promise.all([
    supabase
      .from('sorteo_participantes')
      .select('id, nombre, telefono, barrio, modalidad, monto_compra, chances, origen, acepta_novedades, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('sorteo_ganadores')
      .select('puesto, premio_monto, seed, total_chances, sorteado_at, sorteo_participantes(nombre, telefono)')
      .order('puesto', { ascending: true }),
  ])

  const participantes = (participantesRaw ?? []) as Participante[]
  const ganadores = (ganadoresRaw ?? []) as unknown as Ganador[]

  const conCompra = participantes.filter(p => p.modalidad === 'con_compra')
  const chancesTotales = participantes.reduce((acc, p) => acc + p.chances, 0)
  const facturacion = conCompra.reduce((acc, p) => acc + Number(p.monto_compra ?? 0), 0)
  const ticketPromedio = conCompra.length ? facturacion / conCompra.length : 0
  const consentidos = participantes.filter(p => p.acepta_novedades).length
  const personasUnicas = new Set(participantes.map(p => p.telefono)).size

  const porOrigen = Object.entries(
    participantes.reduce<Record<string, number>>((acc, p) => {
      const k = p.origen ?? 'sin_dato'
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])

  return (
    <main className="max-w-3xl mx-auto p-4 pb-16 space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-800">Sorteo del almacén</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Participantes, rendimiento por canal y extracción de ganadores
        </p>
      </header>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Kpi
          valor={String(participantes.length)}
          etiqueta="Participaciones"
          detalle={`${personasUnicas} personas distintas`}
        />
        <Kpi valor={String(chancesTotales)} etiqueta="Chances en la bolsa" />
        <Kpi
          valor={`${conCompra.length}/${PROMO.stockPacks}`}
          etiqueta="Packs entregados"
          detalle={`Quedan ${Math.max(0, PROMO.stockPacks - conCompra.length)}`}
        />
        <Kpi valor={formatARS(facturacion)} etiqueta="Facturación de la promo" />
        <Kpi
          valor={formatARS(ticketPromedio)}
          etiqueta="Ticket promedio"
          detalle={`Mínimo exigido: ${formatARS(PROMO.compraMinima)}`}
        />
        <Kpi
          valor={String(consentidos)}
          etiqueta="Aceptan novedades"
          detalle="Base para difusión por WhatsApp"
        />
      </div>

      {/* ── Ganadores / sorteo ── */}
      <section className="bg-white rounded-2xl border-2 border-stone-200 p-5">
        <h2 className="font-extrabold text-stone-800">Extracción</h2>

        {ganadores.length > 0 ? (
          <div className="mt-4 space-y-3">
            {ganadores.map(g => (
              <div
                key={g.puesto}
                className="flex items-center justify-between gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200"
              >
                <span>
                  <span className="block font-extrabold text-stone-800">
                    {g.puesto}º · {g.sorteo_participantes?.nombre ?? 'Participante eliminado'}
                  </span>
                  <span className="block text-xs text-stone-500 mt-0.5">
                    {g.sorteo_participantes
                      ? formatearTelefono(g.sorteo_participantes.telefono)
                      : '—'}
                  </span>
                </span>
                <span className="font-extrabold text-red-700">
                  {formatARS(g.premio_monto)}
                </span>
              </div>
            ))}

            <p className="text-[11px] text-stone-400 leading-relaxed pt-1">
              Semilla de auditoría: <code className="break-all">{ganadores[0].seed}</code>
              <br />
              Sobre {ganadores[0].total_chances} chances ·{' '}
              {new Date(ganadores[0].sorteado_at).toLocaleString('es-AR')}
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <SortearButton habilitado={personasUnicas >= 3} />
          </div>
        )}
      </section>

      {/* ── Canales ── */}
      <section className="bg-white rounded-2xl border-2 border-stone-200 p-5">
        <h2 className="font-extrabold text-stone-800">De dónde vienen</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Esto define dónde poner la plata la próxima vez.
        </p>

        {porOrigen.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Todavía no hay datos.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {porOrigen.map(([origen, cantidad]) => {
              const pct = Math.round((cantidad / participantes.length) * 100)
              return (
                <li key={origen}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-stone-700">
                      {ORIGEN_LABEL[origen] ?? 'Sin dato'}
                    </span>
                    <span className="font-bold text-stone-500">
                      {cantidad} · {pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full bg-red-600" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Exportar ── */}
      <section className="bg-white rounded-2xl border-2 border-stone-200 p-5">
        <h2 className="font-extrabold text-stone-800">Exportar</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Para armar la lista de difusión de WhatsApp.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/api/sorteo/export"
            className="px-4 py-3 rounded-xl bg-stone-800 text-white text-sm font-bold"
          >
            Descargar los que aceptan novedades
          </a>
          <a
            href="/api/sorteo/export?todos=1"
            className="px-4 py-3 rounded-xl bg-white border-2 border-stone-200 text-sm font-bold text-stone-700"
          >
            Descargar todos
          </a>
        </div>
        <p className="mt-3 text-[11px] text-stone-400 leading-relaxed">
          Escribile sólo a quienes aceptaron novedades. Al resto se lo contactó
          únicamente para el sorteo.
        </p>
      </section>

      {/* ── Últimas participaciones ── */}
      <section className="bg-white rounded-2xl border-2 border-stone-200 p-5">
        <h2 className="font-extrabold text-stone-800">Últimas participaciones</h2>

        {participantes.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Todavía no cargó nadie.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-400">
                  <th className="pb-2 font-bold">Nombre</th>
                  <th className="pb-2 font-bold">WhatsApp</th>
                  <th className="pb-2 font-bold">Barrio</th>
                  <th className="pb-2 font-bold text-right">Compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {participantes.slice(0, 50).map(p => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-semibold text-stone-800">{p.nombre}</td>
                    <td className="py-2.5 text-stone-600">{formatearTelefono(p.telefono)}</td>
                    <td className="py-2.5 text-stone-500">{p.barrio ?? '—'}</td>
                    <td className="py-2.5 text-right font-bold text-stone-700">
                      {p.modalidad === 'con_compra' && p.monto_compra
                        ? formatARS(Number(p.monto_compra))
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {participantes.length > 50 && (
              <p className="mt-3 text-xs text-stone-400">
                Mostrando las 50 más recientes de {participantes.length}. El resto está en
                el CSV.
              </p>
            )}
          </div>
        )}
      </section>

      <p className="text-center text-xs text-stone-400">
        <Link href="/sorteo/cartel" className="underline font-bold">
          Imprimir el cartel del mostrador
        </Link>
      </p>
    </main>
  )
}
