import type { Metadata } from 'next'
import Link from 'next/link'
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
  title: `Bases y condiciones | ${COMERCIO.nombre}`,
  description: `Bases y condiciones de la promoción "${PROMO.regalo} de regalo" y del sorteo de ${formatARS(PREMIO_TOTAL)} en órdenes de compra.`,
}

function Articulo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="font-extrabold text-stone-800 text-base">
        {n}. {titulo}
      </h2>
      <div className="mt-2 space-y-2 text-sm text-stone-600 leading-relaxed">{children}</div>
    </section>
  )
}

export default function BasesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-5 py-10">
        <Link href="/sorteo" className="text-sm font-bold text-red-700 underline">
          ← Volver a la promoción
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold text-stone-800">
          Bases y condiciones
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Promoción «{PROMO.regalo} de regalo» y sorteo de {formatARS(PREMIO_TOTAL)} en
          órdenes de compra · {COMERCIO.nombre}
        </p>

        <Articulo n={1} titulo="Organizador">
          <p>
            La presente promoción es organizada por {COMERCIO.razonSocial}, CUIT{' '}
            {COMERCIO.cuit}, con domicilio comercial en {COMERCIO_DIRECCION}, provincia
            de {COMERCIO.provincia} (en adelante, «el Organizador»).
          </p>
        </Articulo>

        <Articulo n={2} titulo="Vigencia">
          <p>
            La promoción se desarrolla desde el {formatFechaLarga(FECHAS.inicio)} hasta el{' '}
            {formatFechaLarga(FECHAS.fin)} inclusive, o hasta agotar el stock de{' '}
            {PROMO.stockPacks} packs de regalo, lo que ocurra primero.
          </p>
          <p>
            El sorteo se realiza el {formatFechaLarga(FECHAS.sorteo)} y se transmite en
            vivo por la cuenta de Instagram @{COMERCIO.instagram}.
          </p>
        </Articulo>

        <Articulo n={3} titulo="Quiénes pueden participar">
          <p>
            Personas humanas mayores de 18 años, con domicilio en la ciudad de{' '}
            {COMERCIO.ciudad}, provincia de {COMERCIO.provincia}, que cuenten con DNI
            argentino vigente.
          </p>
          <p>
            No pueden participar el titular, los empleados del Organizador ni sus
            familiares directos hasta el segundo grado de consanguinidad.
          </p>
        </Articulo>

        <Articulo n={4} titulo="Mecánica de participación">
          <p>
            <strong>Vía A — con compra.</strong> Por cada compra igual o superior a{' '}
            {formatARS(PROMO.compraMinima)} realizada en el local durante la vigencia, el
            participante recibe {PROMO.regalo} de regalo y obtiene una (1) chance en el
            sorteo, completando el formulario disponible en {COMERCIO.instagram ? 'la web de la promoción' : 'la web'}{' '}
            con sus datos y el número de ticket.
          </p>
          <p>
            <strong>Vía B — sin obligación de compra.</strong> Quien no desee realizar una
            compra puede obtener una (1) chance completando el mismo formulario en la
            modalidad «sin compra», o solicitando el formulario en papel en el mostrador
            del local durante el horario de atención. Esta vía no da derecho al regalo de{' '}
            {PROMO.regalo}. Se admite una sola participación sin compra por persona
            durante toda la vigencia.
          </p>
          <p>
            Cada número de ticket habilita una única participación. Las chances obtenidas
            por distintas compras se acumulan.
          </p>
        </Articulo>

        <Articulo n={5} titulo="Condiciones del regalo">
          <p>
            El regalo consiste en {PROMO.regalo}, se entrega en el momento de la compra,
            en el local, y está sujeto a disponibilidad de stock.
          </p>
          <p>
            No computan para alcanzar el monto mínimo de compra los siguientes rubros:{' '}
            {PROMO.excluidos.join(', ')}.
          </p>
          <p>
            El beneficio no es acumulable con otras promociones vigentes, no es
            canjeable por dinero y se limita a un (1) regalo por persona por día.
          </p>
        </Articulo>

        <Articulo n={6} titulo="Premios">
          <p>Se sortean tres (3) órdenes de compra para consumir en el local:</p>
          <ul className="list-disc pl-5 space-y-1">
            {PREMIOS.map(p => (
              <li key={p.puesto}>
                <strong>{p.etiqueta}:</strong> orden de compra por {formatARS(p.monto)}.
              </li>
            ))}
          </ul>
          <p>
            Los premios no son canjeables por dinero en efectivo ni transferibles a
            terceros. Si el consumo resulta inferior al valor de la orden, la diferencia
            no se devuelve. Si resulta superior, el ganador abona la diferencia.
          </p>
        </Articulo>

        <Articulo n={7} titulo="Sorteo y determinación de los ganadores">
          <p>
            El sorteo se realiza sobre la totalidad de las chances válidas registradas
            hasta las 23:59 del {formatFechaLarga(FECHAS.fin)}, mediante un procedimiento
            aleatorio informático que registra la semilla utilizada, permitiendo auditar
            el resultado.
          </p>
          <p>
            Se extraen tres (3) ganadores distintos, uno por cada premio. Una misma
            persona no puede resultar ganadora de más de un premio.
          </p>
        </Articulo>

        <Articulo n={8} titulo="Notificación y entrega">
          <p>
            Los ganadores son notificados al número de WhatsApp declarado en el
            formulario, dentro de las 48 horas del sorteo, y publicados en la cuenta de
            Instagram del Organizador.
          </p>
          <p>
            Para retirar el premio deben presentarse en {COMERCIO_DIRECCION} con DNI y el
            ticket de compra correspondiente, dentro de los {FECHAS.diasParaRetirar} días
            corridos posteriores a la notificación. Vencido ese plazo sin que el ganador
            se presente, el premio se considera renunciado y el Organizador podrá
            asignarlo al siguiente participante extraído como suplente.
          </p>
        </Articulo>

        <Articulo n={9} titulo="Datos personales">
          <p>
            Los datos se recolectan con la única finalidad de administrar esta promoción
            y, cuando el participante lo autoriza expresamente marcando la opción
            correspondiente, para enviarle novedades y ofertas del comercio.
          </p>
          <p>
            El titular de los datos puede solicitar en cualquier momento el acceso,
            rectificación o supresión de sus datos escribiendo al WhatsApp del local. El
            tratamiento se realiza conforme a la Ley 25.326 de Protección de los Datos
            Personales. Los datos no se ceden ni se venden a terceros.
          </p>
        </Articulo>

        <Articulo n={10} titulo="Uso de imagen">
          <p>
            La aceptación del premio implica la autorización al Organizador para difundir
            el nombre y la imagen del ganador en sus redes sociales con fines de
            comunicación de esta promoción, sin derecho a compensación alguna.
          </p>
        </Articulo>

        <Articulo n={11} titulo="Aceptación y disposiciones generales">
          <p>
            La participación implica el conocimiento y la aceptación íntegra de estas
            bases. El Organizador podrá modificarlas o suspender la promoción por causas
            de fuerza mayor, comunicándolo por los mismos medios de difusión y sin
            afectar los derechos ya adquiridos por los participantes.
          </p>
          <p>
            Ante cualquier controversia, las partes se someten a los tribunales
            ordinarios de la ciudad de {COMERCIO.ciudad}, provincia de{' '}
            {COMERCIO.provincia}.
          </p>
        </Articulo>

        <div className="mt-10 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300">
          <p className="text-sm font-extrabold text-stone-800">
            ⚠️ Revisión pendiente antes de publicar
          </p>
          <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">
            Este texto es un borrador de trabajo, no un dictamen legal. Antes de salir al
            aire hay que completar razón social y CUIT, y confirmar con un profesional si
            esta promoción requiere autorización previa del organismo provincial de
            juegos de azar de {COMERCIO.provincia} y/o registro ante Defensa del
            Consumidor. Este bloque se borra del archivo una vez resuelto.
          </p>
        </div>
      </div>
    </main>
  )
}
