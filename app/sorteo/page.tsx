import type { Metadata } from 'next'
import Link from 'next/link'
import { SorteoForm } from './SorteoForm'
import {
  COMERCIO,
  COMERCIO_DIRECCION,
  FECHAS,
  PREMIOS,
  PREMIO_TOTAL,
  PROMO,
  formatARS,
  formatFechaLarga,
} from '@/lib/sorteo/config'

export const metadata: Metadata = {
  title: `${PROMO.regalo} de regalo + sorteo de ${formatARS(PREMIO_TOTAL)} | ${COMERCIO.nombre}`,
  description: `Comprá ${formatARS(PROMO.compraMinima)} o más en ${COMERCIO.nombre} (${COMERCIO.barrio}, ${COMERCIO.ciudad}), llevate ${PROMO.regalo} de regalo y participá por ${formatARS(PREMIO_TOTAL)} en órdenes de compra.`,
  openGraph: {
    title: `${PROMO.regalo} de regalo en ${COMERCIO.nombre}`,
    description: `Sorteamos ${formatARS(PREMIO_TOTAL)} en órdenes de compra entre los vecinos de ${COMERCIO.barrio}.`,
    type: 'website',
  },
}

const PASOS = [
  {
    n: 1,
    titulo: 'Vení al almacén',
    texto: `Estamos en ${COMERCIO_DIRECCION}.`,
  },
  {
    n: 2,
    titulo: `Comprá ${formatARS(PROMO.compraMinima)} o más`,
    texto: `Pedí tus ${PROMO.regalo} en la caja. Te los llevás de regalo, sin vueltas.`,
  },
  {
    n: 3,
    titulo: 'Cargá tus datos acá',
    texto: 'Con el número de ticket entrás al sorteo. Te avisamos por WhatsApp.',
  },
]

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${COMERCIO.calle} ${COMERCIO.altura}, ${COMERCIO.ciudad}, ${COMERCIO.provincia}`
)}`

export default function SorteoPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* ── Hero ── */}
      <header className="bg-red-700 text-white px-5 pt-10 pb-12 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-200">
          {COMERCIO.nombre} · {COMERCIO.barrio}
        </p>

        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-[1.05]">
          El asado del domingo
          <br />
          <span className="text-amber-300">lo ponemos nosotros</span>
        </h1>

        <p className="mt-5 text-lg font-bold text-red-50 max-w-md mx-auto">
          Llevate {PROMO.regalo} de regalo con tu compra de{' '}
          {formatARS(PROMO.compraMinima)} o más.
        </p>

        <p className="mt-2 text-sm text-red-200">
          Y participás por {formatARS(PREMIO_TOTAL)} en órdenes de compra.
        </p>

        <a
          href="#participar"
          className="mt-7 inline-flex items-center justify-center min-h-[56px] px-8
                     rounded-2xl bg-amber-400 text-red-900 text-lg font-extrabold
                     shadow-xl transition-transform active:scale-95 hover:bg-amber-300"
        >
          Quiero participar
        </a>

        <p className="mt-4 text-xs text-red-200">
          Hasta agotar stock · {PROMO.stockPacks} packs disponibles
        </p>
      </header>

      {/* ── Premios ── */}
      <section className="px-5 -mt-6">
        <div className="max-w-lg mx-auto bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-lg">
          <h2 className="text-center font-extrabold text-stone-800 text-xl">
            Sorteamos {formatARS(PREMIO_TOTAL)} en compras
          </h2>
          <p className="text-center text-sm text-stone-500 mt-1">
            Tres ganadores, el {formatFechaLarga(FECHAS.sorteo)}
          </p>

          <ul className="mt-5 space-y-2.5">
            {PREMIOS.map(p => (
              <li
                key={p.puesto}
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid place-items-center w-9 h-9 rounded-full bg-red-700 text-white font-extrabold text-sm"
                  >
                    {p.puesto}º
                  </span>
                  <span className="font-bold text-stone-700 text-sm">{p.etiqueta}</span>
                </span>
                <span className="font-extrabold text-red-700 text-xl">
                  {formatARS(p.monto)}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-stone-500 text-center">
            Los premios son órdenes de compra para gastar en el almacén.
          </p>
        </div>
      </section>

      {/* ── Cómo participar ── */}
      <section className="px-5 pt-10">
        <div className="max-w-lg mx-auto">
          <h2 className="font-extrabold text-stone-800 text-2xl text-center">
            Cómo participar
          </h2>

          <ol className="mt-6 space-y-4">
            {PASOS.map(paso => (
              <li key={paso.n} className="flex gap-4">
                <span
                  aria-hidden
                  className="shrink-0 grid place-items-center w-10 h-10 rounded-full
                             bg-amber-400 text-red-900 font-extrabold"
                >
                  {paso.n}
                </span>
                <span>
                  <span className="block font-extrabold text-stone-800">{paso.titulo}</span>
                  <span className="block text-sm text-stone-600 mt-0.5">{paso.texto}</span>
                </span>
              </li>
            ))}
          </ol>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-between gap-3 p-4 rounded-2xl
                       bg-white border-2 border-stone-200 hover:border-red-400 transition-colors"
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-wide text-stone-400">
                Dónde estamos
              </span>
              <span className="block font-bold text-stone-800 text-sm mt-0.5">
                {COMERCIO_DIRECCION}
              </span>
            </span>
            <span className="text-red-700 font-extrabold text-sm shrink-0">Ver mapa</span>
          </a>
        </div>
      </section>

      {/* ── Formulario ── */}
      <section id="participar" className="px-5 pt-12 pb-16 scroll-mt-4">
        <div className="max-w-lg mx-auto bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-sm">
          <h2 className="font-extrabold text-stone-800 text-2xl">Cargá tus datos</h2>
          <p className="text-sm text-stone-500 mt-1">
            Te toma menos de un minuto. Participás hasta el {formatFechaLarga(FECHAS.fin)}.
          </p>

          <div className="mt-6">
            <SorteoForm />
          </div>
        </div>
      </section>

      {/* ── Pie ── */}
      <footer className="px-5 pb-12 text-center">
        <p className="text-sm font-bold text-stone-700">{COMERCIO.nombre}</p>
        <p className="text-xs text-stone-500 mt-1">{COMERCIO_DIRECCION}</p>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs font-bold">
          <Link href="/sorteo/bases" className="text-red-700 underline">
            Bases y condiciones
          </Link>
          <a
            href={`https://instagram.com/${COMERCIO.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-700 underline"
          >
            @{COMERCIO.instagram}
          </a>
        </div>

        <p className="mt-5 text-[11px] text-stone-400 max-w-md mx-auto leading-relaxed">
          Promoción sin obligación de compra. Consultá las vías de participación
          alternativas en las bases y condiciones.
        </p>
      </footer>
    </main>
  )
}
