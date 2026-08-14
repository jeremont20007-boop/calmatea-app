import type { Metadata } from 'next'
import QRCode from 'qrcode'
import {
  COMERCIO,
  COMERCIO_DIRECCION,
  WHATSAPP_SALUDO,
  WHATSAPP_SIN_CARGAR,
  WHATSAPP_URL,
} from '@/lib/sorteo/config'

export const metadata: Metadata = {
  title: `Cartel de WhatsApp | ${COMERCIO.nombre}`,
  robots: { index: false },
}

/**
 * Cartel A4 con el QR que abre el chat de WhatsApp del local con un "Hola!" ya
 * escrito. Es el paso previo a cualquier promoción que necesite que el cliente
 * nos escriba: si no nos tiene agendados, no puede mandarnos nada.
 */
export default async function CartelWhatsAppPage() {
  const qrSvg = WHATSAPP_SIN_CARGAR
    ? null
    : await QRCode.toString(WHATSAPP_URL, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 1,
        color: { dark: '#0B3D2E', light: '#FFFFFF' },
      })

  return (
    <main className="min-h-screen bg-stone-100 print:bg-white">
      <div className="print:hidden max-w-[210mm] mx-auto px-5 pt-8">
        <div className="p-4 rounded-2xl bg-white border-2 border-stone-200">
          <p className="font-extrabold text-stone-800">Cartel de WhatsApp</p>
          <p className="mt-1 text-sm text-stone-600">
            Imprimilo en A4 y pegalo en la caja, al lado del QR de la promoción. El
            cliente lo escanea y le abre el chat con el local con un «{WHATSAPP_SALUDO}»
            ya escrito: sólo tiene que apretar enviar.
          </p>
          {WHATSAPP_SIN_CARGAR && (
            <p className="mt-3 p-3 rounded-xl bg-red-50 border-2 border-red-200 text-sm font-bold text-red-700">
              Falta cargar el WhatsApp del local en <code>lib/sorteo/config.ts</code>.
              Hasta entonces el QR no se genera, porque llevaría a un número inexistente.
            </p>
          )}
        </div>
      </div>

      {/* ── Hoja A4 ── */}
      <div
        className="max-w-[210mm] mx-auto my-8 print:my-0 bg-white
                   px-12 py-14 print:px-10 print:py-10 text-center
                   border-2 border-stone-200 print:border-0"
      >
        <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-emerald-800">
          {COMERCIO.nombre}
        </p>

        <h1 className="mt-8 text-6xl font-extrabold leading-[1.02] text-stone-900">
          Guardanos
          <br />
          <span className="text-emerald-800">en tu WhatsApp</span>
        </h1>

        <p className="mt-8 text-2xl font-bold text-stone-700">
          Escaneá y mandanos un «{WHATSAPP_SALUDO}»
        </p>

        <div className="mt-10 flex flex-col items-center">
          {qrSvg ? (
            <div
              className="w-[62mm] h-[62mm] [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : (
            <div className="w-[62mm] h-[62mm] grid place-items-center border-4 border-dashed border-stone-300 rounded-2xl px-6">
              <p className="text-base font-bold text-stone-400 leading-snug">
                Acá va el QR.
                <br />
                Falta cargar el número.
              </p>
            </div>
          )}

          <p className="mt-6 text-xl text-stone-600 max-w-md">
            Te avisamos las ofertas de la semana y podés hacernos el pedido por mensaje.
          </p>
        </div>

        <p className="mt-12 text-sm text-stone-500">{COMERCIO_DIRECCION}</p>
      </div>
    </main>
  )
}
