import type { Metadata } from 'next'
import Link from 'next/link'
import {
  COMERCIO,
  FECHAS,
  PREMIO_TOTAL,
  formatARS,
  formatFechaLarga,
} from '@/lib/sorteo/config'

export const metadata: Metadata = {
  title: `¡Ya estás participando! | ${COMERCIO.nombre}`,
  robots: { index: false },
}

const mensajeWhatsApp = encodeURIComponent(
  `¡Mirá! En ${COMERCIO.nombre} (${COMERCIO.barrio}) están regalando chorizos con tu compra y sortean ${formatARS(PREMIO_TOTAL)} en órdenes de compra. Participá acá:`
)

export default function GraciasPage() {
  return (
    <main className="min-h-screen bg-stone-50 grid place-items-center px-5 py-16">
      <div className="max-w-md w-full text-center">
        <div
          aria-hidden
          className="mx-auto grid place-items-center w-20 h-20 rounded-full bg-red-700 text-white text-4xl"
        >
          ✓
        </div>

        <h1 className="mt-6 text-3xl font-extrabold text-stone-800">
          ¡Ya estás participando!
        </h1>

        <p className="mt-3 text-stone-600">
          Guardamos tus datos. El sorteo es el{' '}
          <strong className="text-stone-800">{formatFechaLarga(FECHAS.sorteo)}</strong> y lo
          hacemos en vivo por Instagram.
        </p>

        <div className="mt-6 p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-left">
          <p className="font-extrabold text-stone-800 text-sm">Guardá tu ticket</p>
          <p className="text-sm text-stone-600 mt-1">
            Para retirar el premio hay que presentarlo junto con el DNI. Si ganás, te
            escribimos al WhatsApp que cargaste.
          </p>
        </div>

        <a
          href={`https://wa.me/?text=${mensajeWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center min-h-[56px] px-6 rounded-2xl
                     bg-green-600 text-white font-extrabold shadow-lg
                     transition-transform active:scale-95 hover:bg-green-700"
        >
          Contarle a un vecino por WhatsApp
        </a>

        <a
          href={`https://instagram.com/${COMERCIO.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center min-h-[56px] px-6 rounded-2xl
                     bg-white border-2 border-stone-200 text-stone-800 font-extrabold
                     transition-colors hover:border-red-400"
        >
          Seguirnos en Instagram
        </a>

        <p className="mt-8 text-xs text-stone-400">
          <Link href="/sorteo/bases" className="underline">
            Bases y condiciones
          </Link>
        </p>
      </div>
    </main>
  )
}
