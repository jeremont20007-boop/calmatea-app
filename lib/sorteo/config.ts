/**
 * Configuración central de la campaña "4 chorizos de regalo + sorteo".
 *
 * ⚠️ TODO lo que hay que completar antes de publicar está marcado con `COMPLETAR`.
 * Cambiando este archivo se actualizan la landing, las bases y condiciones,
 * el cartel del mostrador y el panel de administración.
 */

export const COMERCIO = {
  /** COMPLETAR: nombre comercial tal como lo conoce el barrio. */
  nombre: 'COMPLETAR — Nombre del almacén',
  /** COMPLETAR: falta el nombre de la calle (me pasaste la altura: 2441). */
  calle: 'COMPLETAR — Calle',
  altura: '2441',
  barrio: 'Barrio Sapere',
  ciudad: 'Neuquén Capital',
  provincia: 'Neuquén',
  /** COMPLETAR: número de WhatsApp del local, formato internacional sin signos. */
  whatsapp: '549299COMPLETAR',
  /** COMPLETAR: usuario de Instagram sin la arroba. */
  instagram: 'completar',
  /** COMPLETAR: razón social y CUIT — hacen falta en las bases y condiciones. */
  razonSocial: 'COMPLETAR — Razón social',
  cuit: 'COMPLETAR — CUIT',
} as const

export const COMERCIO_DIRECCION = `${COMERCIO.calle} ${COMERCIO.altura}, ${COMERCIO.barrio}, ${COMERCIO.ciudad}`

/** `true` mientras el número del local siga sin cargarse: el QR no serviría. */
export const WHATSAPP_SIN_CARGAR = COMERCIO.whatsapp.includes('COMPLETAR')

/** Mensaje que queda pre-escrito cuando el cliente abre el chat desde el QR. */
export const WHATSAPP_SALUDO = 'Hola!'

/** Link que abre el chat con el local y el saludo ya tipeado. */
export const WHATSAPP_URL = `https://wa.me/${COMERCIO.whatsapp}?text=${encodeURIComponent(WHATSAPP_SALUDO)}`

export const PROMO = {
  /** Lo que se regala al llegar al mínimo de compra. */
  regalo: '4 chorizos',
  /**
   * COMPLETAR: monto mínimo de compra para llevarse el regalo.
   * Regla práctica: entre 1,3× y 1,5× tu ticket promedio actual, y siempre
   * por encima de 6× el costo de los 4 chorizos para que la promo se pague sola.
   */
  compraMinima: 18000,
  /** Tope de packs de la campaña. Fija el techo del costo y genera urgencia. */
  stockPacks: 300,
  /**
   * Rubros que no suman para el mínimo (márgenes bajos o venta regulada).
   * Se listan tal cual en las bases y condiciones.
   */
  excluidos: [
    'cigarrillos',
    'recargas de celular y tarjetas SUBE',
    'bebidas alcohólicas',
    'garrafas',
    'pago de servicios',
  ],
  /**
   * Si se define un monto, las compras que lo superen suman chance doble.
   * `null` deja una chance por compra (la mecánica elegida).
   */
  chanceDobleDesde: null as number | null,
} as const

export const PREMIOS = [
  { puesto: 1, monto: 70000, etiqueta: '1er premio' },
  { puesto: 2, monto: 50000, etiqueta: '2do premio' },
  { puesto: 3, monto: 30000, etiqueta: '3er premio' },
] as const

export const PREMIO_TOTAL = PREMIOS.reduce((acc, p) => acc + p.monto, 0)

export const FECHAS = {
  /** COMPLETAR: fecha de arranque (formato ISO, zona Argentina). */
  inicio: '2026-08-20',
  /** COMPLETAR: último día para participar. Son 3 semanas de campaña. */
  fin: '2026-09-09',
  /** COMPLETAR: día del sorteo. Conviene un sábado, en vivo por Instagram. */
  sorteo: '2026-09-12',
  /** Días que tiene el ganador para retirar la orden de compra. */
  diasParaRetirar: 30,
} as const

/** Barrios sugeridos en el formulario. Sirven para medir el alcance real de la pauta. */
export const BARRIOS = [
  'Sapere',
  'Villa Florencia',
  'Don Bosco',
  'Confluencia',
  'Bouquet Roldán',
  'Centro',
  'Otro',
] as const

/** De dónde se enteró el participante. Es la única forma de saber qué canal funciona. */
export const ORIGENES = [
  { value: 'mostrador', label: 'Vine al almacén y lo vi acá' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp', label: 'Me lo pasaron por WhatsApp' },
  { value: 'volante', label: 'Un volante en la calle' },
  { value: 'boca_a_boca', label: 'Me lo contó un conocido' },
] as const

export type OrigenValue = (typeof ORIGENES)[number]['value']

export function formatARS(monto: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto)
}

export function formatFechaLarga(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}
