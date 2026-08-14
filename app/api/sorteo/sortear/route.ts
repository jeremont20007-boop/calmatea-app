import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { esAdmin } from '@/lib/sorteo/auth'
import { PREMIOS } from '@/lib/sorteo/config'
import {
  contarChances,
  extraerGanadores,
  type ParticipanteSorteable,
} from '@/lib/sorteo/sorteo'

export async function POST() {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const supabase = createAdminClient()

  // El sorteo se hace una sola vez. Para rehacerlo hay que borrar las filas de
  // sorteo_ganadores a mano desde Supabase, y que quede registro de por qué.
  const { count: yaSorteado } = await supabase
    .from('sorteo_ganadores')
    .select('id', { count: 'exact', head: true })

  if ((yaSorteado ?? 0) > 0) {
    return NextResponse.json(
      { error: 'El sorteo ya fue realizado. Los ganadores están registrados.' },
      { status: 409 }
    )
  }

  const { data: participantes, error: errorLectura } = await supabase
    .from('sorteo_participantes')
    .select('id, nombre, telefono, chances')

  if (errorLectura) {
    console.error('[sorteo/sortear] lectura', errorLectura)
    return NextResponse.json({ error: 'No pudimos leer los participantes.' }, { status: 500 })
  }

  const bolsa = (participantes ?? []) as ParticipanteSorteable[]
  if (bolsa.length < PREMIOS.length) {
    return NextResponse.json(
      { error: `Hacen falta al menos ${PREMIOS.length} participantes para sortear.` },
      { status: 400 }
    )
  }

  const seed = randomUUID()
  const totalChances = contarChances(bolsa)
  const extracciones = extraerGanadores(
    bolsa,
    PREMIOS.map(p => ({ puesto: p.puesto, monto: p.monto })),
    seed
  )

  if (extracciones.length < PREMIOS.length) {
    return NextResponse.json(
      { error: 'No hay suficientes participantes distintos para cubrir los tres premios.' },
      { status: 400 }
    )
  }

  const { error: errorInsert } = await supabase.from('sorteo_ganadores').insert(
    extracciones.map(e => ({
      participante_id: e.participante.id,
      puesto: e.puesto,
      premio_monto: e.premio_monto,
      seed,
      total_chances: totalChances,
    }))
  )

  if (errorInsert) {
    console.error('[sorteo/sortear] insert', errorInsert)
    return NextResponse.json({ error: 'No pudimos registrar los ganadores.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    seed,
    totalChances,
    ganadores: extracciones.map(e => ({
      puesto: e.puesto,
      premio_monto: e.premio_monto,
      nombre: e.participante.nombre,
    })),
  })
}
