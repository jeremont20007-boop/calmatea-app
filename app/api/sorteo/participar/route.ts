import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validarParticipacion, type ParticipacionInput } from '@/lib/sorteo/validacion'
import { FECHAS, formatFechaLarga } from '@/lib/sorteo/config'

/** Sólo se aceptan participaciones entre `FECHAS.inicio` y `FECHAS.fin`, inclusive. */
function estadoCampania(): 'no_empezo' | 'vigente' | 'cerrada' {
  // La campaña es local: se evalúa contra el día calendario en Argentina.
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  if (hoy < FECHAS.inicio) return 'no_empezo'
  if (hoy > FECHAS.fin) return 'cerrada'
  return 'vigente'
}

export async function POST(request: NextRequest) {
  const estado = estadoCampania()
  if (estado !== 'vigente') {
    return NextResponse.json(
      {
        error:
          estado === 'no_empezo'
            ? `La promoción arranca el ${formatFechaLarga(FECHAS.inicio)}. ¡Te esperamos!`
            : 'La campaña ya cerró. ¡Gracias por participar!',
      },
      { status: 409 }
    )
  }

  let body: ParticipacionInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 })
  }

  const validacion = validarParticipacion(body)
  if (!validacion.ok) {
    return NextResponse.json({ error: validacion.error }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('sorteo_participantes').insert(validacion.data)

  if (error) {
    // 23505 = unique_violation. Los dos índices parciales del schema.
    if (error.code === '23505') {
      const mensaje =
        validacion.data.modalidad === 'sin_compra'
          ? 'Ya cargaste tu participación sin compra con este número de WhatsApp.'
          : 'Ese número de ticket ya fue cargado. Cada compra participa una sola vez.'
      return NextResponse.json({ error: mensaje }, { status: 409 })
    }
    console.error('[sorteo/participar]', error)
    return NextResponse.json(
      { error: 'No pudimos guardar tu participación. Probá de nuevo en un minuto.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
