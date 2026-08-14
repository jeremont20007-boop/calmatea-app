import type { Metadata } from 'next'
import QRCode from 'qrcode'
import {
  COMERCIO,
  PREMIO_TOTAL,
  PROMO,
  formatARS,
} from '@/lib/sorteo/config'

export const metadata: Metadata = {
  title: `Cartel para el mostrador | ${COMERCIO.nombre}`,
  robots: { index: false },
}

/**
 * Cartel A4 para imprimir y pegar en la caja. Abrir esta página y usar
 * "Imprimir" del navegador: los controles de pantalla se ocultan al imprimir.
 */
export default async function CartelPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = `${base}/sorteo`

  const qrSvg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 1,
    color: { dark: '#7F1D1D', light: '#FFFFFF' },
  })

  return (
    <main className="min-h-screen bg-stone-100 print:bg-white">
      <div className="print:hidden max-w-[210mm] mx-auto px-5 pt-8">
        <div className="p-4 rounded-2xl bg-white border-2 border-stone-200">
          <p className="font-extrabold text-stone-800">Cartel para el mostrador</p>
          <p className="mt-1 text-sm text-stone-600">
            Imprimí esta página en A4 y pegala en la caja. El QR apunta a{' '}
            <code className="text-red-700 font-bold break-all">{url}</code>.
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Si la URL todavía es localhost, definí <code>NEXT_PUBLIC_APP_URL</code> antes
            de imprimir.
          </p>
        </div>
      </div>

      {/* ── Hoja A4 ── */}
      <div
        className="max-w-[210mm] mx-auto my-8 print:my-0 bg-white
                   px-12 py-14 print:px-10 print:py-10 text-center
                   border-2 border-stone-200 print:border-0"
      >
        <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-red-700">
          {COMERCIO.nombre}
        </p>

        <h1 className="mt-8 text-6xl font-extrabold leading-[1.02] text-stone-900">
          Llevate
          <br />
          <span className="text-red-700">{PROMO.regalo}</span>
          <br />
          de regalo
        </h1>

        <p className="mt-8 text-2xl font-bold text-stone-700">
          Con tu compra de {formatARS(PROMO.compraMinima)} o más
        </p>

        <div className="mt-10 inline-block px-8 py-4 rounded-3xl bg-amber-400">
          <p className="text-xl font-extrabold text-red-900">
            Y participás por {formatARS(PREMIO_TOTAL)}
          </p>
          <p className="text-base font-bold text-red-800">en órdenes de compra</p>
        </div>

        <div className="mt-12 flex flex-col items-center">
          <div
            className="w-[62mm] h-[62mm] [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="mt-5 text-2xl font-extrabold text-stone-900">
            Escaneá y cargá tus datos
          </p>
          <p className="mt-1 text-lg text-stone-600">
            Tenés el número de ticket en tu comprobante
          </p>
        </div>

        <p className="mt-12 text-sm text-stone-500">
          Hasta agotar stock · {PROMO.stockPacks} packs · Promoción sin obligación de
          compra, consultá bases y condiciones
        </p>
      </div>
    </main>
  )
}
