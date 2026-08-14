/**
 * Combos Digitales de Coca-Cola vigentes en el local.
 *
 * Esta lista alimenta la planilla que se imprime y se pega en la caja
 * (/carteles/combos). Coca-Cola renueva los combos cada dos meses más o menos:
 * cuando lleguen afiches nuevos, se actualiza acá y se reimprime la planilla.
 *
 * Los precios los fija Coca-Cola, no se calculan. El porcentaje que figura en el
 * afiche es sólo para mostrar el ahorro: en la caja se cobra `precio`.
 *
 * Última actualización: 14/08/2026, tomada de la pantalla de Combos Digitales.
 */

export type Combo = {
  /** Cómo lo va a buscar el cajero en la planilla. */
  nombre: string
  /** Qué incluye exactamente. Es lo que hay que chequear contra lo que trae el cliente. */
  detalle: string
  /** Precio final del combo, fijado por Coca-Cola. */
  precio: number
  /** Ahorro que muestra el afiche. `null` cuando el afiche no informa porcentaje. */
  descuento: string | null
  /** Los retornables son la discusión más frecuente en el mostrador. */
  retornable: boolean
  /** Desde cuándo se puede generar el código (ISO). */
  desde: string
  /** Último día para generar el código (ISO). */
  hasta: string
  /** Stock total informado por el afiche. Los de stock chico se agotan. */
  stock: number
}

export const COMBOS: Combo[] = [
  {
    nombre: 'Coca 1,5 L + Sprite 1,5 L',
    detalle: '1 Coca-Cola 1,5 L + 1 Sprite 1,5 L',
    precio: 6900,
    descuento: '50% en la 2da unidad',
    retornable: false,
    desde: '2026-07-20',
    hasta: '2026-08-31',
    stock: 200000,
  },
  {
    nombre: 'Coca + sabor 2 L retornable',
    detalle: '1 Coca-Cola 2 L + 1 sabor 2 L (Sprite o Fanta)',
    precio: 6300,
    descuento: '25%',
    retornable: true,
    desde: '2026-07-20',
    hasta: '2026-08-31',
    stock: 200000,
  },
  {
    nombre: 'Powerade + Coca 500',
    detalle: '1 Powerade 500 ml cualquier sabor + 1 Coca-Cola 500 ml',
    precio: 2400,
    descuento: '50%',
    retornable: false,
    desde: '2026-08-05',
    hasta: '2026-10-31',
    stock: 100,
  },
  {
    nombre: '2 Monster',
    detalle: '2 Monster 473 ml, cualquier sabor',
    precio: 6300,
    descuento: '10%',
    retornable: false,
    desde: '2026-08-05',
    hasta: '2026-10-31',
    stock: 100,
  },
  {
    nombre: 'Coca 2,5 L retornable',
    detalle: '1 Coca-Cola retornable 2,5 L',
    precio: 4200,
    descuento: null,
    retornable: true,
    desde: '2026-08-05',
    hasta: '2026-10-31',
    stock: 100,
  },
  {
    nombre: 'Bonaqua 1,5 L',
    detalle: '1 Bonaqua 1,5 L',
    precio: 1400,
    descuento: '50%',
    retornable: false,
    desde: '2026-08-05',
    hasta: '2026-10-31',
    stock: 100,
  },
]

/** Un stock chico se agota antes de la fecha de vencimiento. */
export const STOCK_LIMITADO = 1000

/** Días de anticipación con que la planilla avisa que un combo está por vencer. */
export const DIAS_AVISO_VENCIMIENTO = 14

export type EstadoCombo = 'vigente' | 'por_vencer' | 'vencido' | 'no_empezo'

/** Estado del combo respecto de una fecha (por defecto, hoy en Argentina). */
export function estadoCombo(combo: Combo, hoyISO?: string): EstadoCombo {
  const hoy =
    hoyISO ??
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  if (hoy < combo.desde) return 'no_empezo'
  if (hoy > combo.hasta) return 'vencido'

  return diasHasta(combo.hasta, hoy) <= DIAS_AVISO_VENCIMIENTO ? 'por_vencer' : 'vigente'
}

/** Días corridos entre dos fechas ISO. */
export function diasHasta(hastaISO: string, desdeISO: string) {
  const ms = Date.parse(`${hastaISO}T00:00:00Z`) - Date.parse(`${desdeISO}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

export function formatFechaCorta(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}
