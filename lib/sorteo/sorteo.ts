/**
 * Lógica del sorteo, aislada del acceso a datos para poder auditarla y
 * reproducirla: con la misma semilla y la misma lista de participantes, el
 * resultado es siempre idéntico. Las bases y condiciones prometen eso.
 */

export type ParticipanteSorteable = {
  id: string
  nombre: string
  telefono: string
  chances: number
}

export type Extraccion = {
  puesto: number
  premio_monto: number
  participante: ParticipanteSorteable
}

/** Hash de string a entero de 32 bits, para derivar el estado inicial del PRNG. */
function xmur3(str: string) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

/** PRNG determinístico sfc32: mismo seed, misma secuencia. */
function sfc32(a: number, b: number, c: number, d: number) {
  return () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0
    let t = (a + b) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    d = (d + 1) | 0
    t = (t + d) | 0
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
}

export function crearRandom(seed: string) {
  const h = xmur3(seed)
  return sfc32(h(), h(), h(), h())
}

/**
 * Extrae un ganador por premio. Cada chance es una boleta en la bolsa, pero
 * una misma persona (identificada por teléfono) no puede ganar dos veces:
 * al salir sorteada se retiran todas sus boletas antes de la extracción
 * siguiente.
 */
export function extraerGanadores(
  participantes: ParticipanteSorteable[],
  premios: readonly { puesto: number; monto: number }[],
  seed: string
): Extraccion[] {
  const random = crearRandom(seed)

  // La bolsa se ordena por id para que el resultado no dependa del orden en
  // que la base devolvió las filas.
  let bolsa = [...participantes].sort((a, b) => a.id.localeCompare(b.id))
  const extracciones: Extraccion[] = []

  for (const premio of premios) {
    const totalChances = bolsa.reduce((acc, p) => acc + p.chances, 0)
    if (totalChances === 0) break

    let corte = Math.floor(random() * totalChances)
    let ganador: ParticipanteSorteable | undefined

    for (const p of bolsa) {
      corte -= p.chances
      if (corte < 0) {
        ganador = p
        break
      }
    }
    if (!ganador) break

    extracciones.push({
      puesto: premio.puesto,
      premio_monto: premio.monto,
      participante: ganador,
    })

    // Se retiran todas las boletas de quien ya ganó.
    const telefonoGanador = ganador.telefono
    bolsa = bolsa.filter(p => p.telefono !== telefonoGanador)
  }

  return extracciones
}

export function contarChances(participantes: ParticipanteSorteable[]) {
  return participantes.reduce((acc, p) => acc + p.chances, 0)
}
