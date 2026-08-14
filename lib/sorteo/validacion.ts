import { PROMO } from './config'

export type ParticipacionInput = {
  nombre: string
  telefono: string
  barrio?: string | null
  modalidad: 'con_compra' | 'sin_compra'
  ticketNumero?: string | null
  montoCompra?: number | null
  origen?: string | null
  aceptaBases: boolean
  aceptaNovedades: boolean
}

export type ParticipacionValida = {
  nombre: string
  telefono: string
  barrio: string | null
  modalidad: 'con_compra' | 'sin_compra'
  ticket_numero: string | null
  monto_compra: number | null
  chances: number
  origen: string | null
  acepta_bases: boolean
  acepta_novedades: boolean
}

/**
 * Deja el teléfono en dígitos con código de área y sin los prefijos que la
 * gente escribe de mil formas distintas (+54, 0, 15). Así dos personas que
 * cargan el mismo número quedan como el mismo registro.
 */
export function normalizarTelefono(raw: string): string | null {
  let d = raw.replace(/\D/g, '')

  if (d.startsWith('54')) d = d.slice(2)
  if (d.startsWith('9')) d = d.slice(1)
  if (d.startsWith('0')) d = d.slice(1)
  // El 15 va después del código de área (ej: 299 15 4123456).
  if (d.length === 12 && d.slice(3, 5) === '15') d = d.slice(0, 3) + d.slice(5)
  if (d.length === 11 && d.slice(2, 4) === '15') d = d.slice(0, 2) + d.slice(4)

  return d.length === 10 ? d : null
}

export function formatearTelefono(d: string) {
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}` : d
}

/** Valida una participación y devuelve la fila lista para insertar, o el error. */
export function validarParticipacion(
  input: ParticipacionInput
): { ok: true; data: ParticipacionValida } | { ok: false; error: string } {
  const nombre = (input.nombre ?? '').trim().replace(/\s+/g, ' ')
  if (nombre.length < 3) {
    return { ok: false, error: 'Escribí tu nombre y apellido.' }
  }
  if (nombre.length > 80) {
    return { ok: false, error: 'El nombre es demasiado largo.' }
  }

  const telefono = normalizarTelefono(input.telefono ?? '')
  if (!telefono) {
    return {
      ok: false,
      error: 'El WhatsApp tiene que tener 10 dígitos con código de área. Ej: 299 412-3456.',
    }
  }

  if (!input.aceptaBases) {
    return { ok: false, error: 'Tenés que aceptar las bases y condiciones para participar.' }
  }

  const modalidad = input.modalidad === 'sin_compra' ? 'sin_compra' : 'con_compra'

  let ticket_numero: string | null = null
  let monto_compra: number | null = null
  let chances = 1

  if (modalidad === 'con_compra') {
    ticket_numero = (input.ticketNumero ?? '').trim().toUpperCase()
    if (ticket_numero.length < 3) {
      return { ok: false, error: 'Cargá el número de ticket que figura en tu comprobante.' }
    }
    if (ticket_numero.length > 30) {
      return { ok: false, error: 'El número de ticket es demasiado largo.' }
    }

    monto_compra = Number(input.montoCompra)
    if (!Number.isFinite(monto_compra) || monto_compra <= 0) {
      return { ok: false, error: 'Cargá el monto total de tu compra.' }
    }
    if (monto_compra < PROMO.compraMinima) {
      return {
        ok: false,
        error: `La compra mínima para participar con regalo es de $${PROMO.compraMinima.toLocaleString('es-AR')}.`,
      }
    }
    if (monto_compra > 5_000_000) {
      return { ok: false, error: 'Revisá el monto de la compra.' }
    }

    if (PROMO.chanceDobleDesde && monto_compra >= PROMO.chanceDobleDesde) chances = 2
  }

  const barrio = (input.barrio ?? '').trim() || null
  const origen = (input.origen ?? '').trim() || null

  return {
    ok: true,
    data: {
      nombre,
      telefono,
      barrio,
      modalidad,
      ticket_numero,
      monto_compra,
      chances,
      origen,
      acepta_bases: true,
      acepta_novedades: Boolean(input.aceptaNovedades),
    },
  }
}
