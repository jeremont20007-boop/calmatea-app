import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { esAdmin } from '@/lib/sorteo/auth'
import { formatearTelefono } from '@/lib/sorteo/validacion'

/** Escapa un valor para CSV: comillas dobles duplicadas y campo entrecomillado. */
function csv(value: unknown) {
  const s = value === null || value === undefined ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

/**
 * Exporta los participantes en CSV para importarlos a la lista de difusión de
 * WhatsApp. Sólo salen los que dieron consentimiento explícito de novedades.
 */
export async function GET(request: Request) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const soloConsentidos =
    new URL(request.url).searchParams.get('todos') !== '1'

  const supabase = createAdminClient()
  let query = supabase
    .from('sorteo_participantes')
    .select(
      'nombre, telefono, barrio, modalidad, ticket_numero, monto_compra, chances, origen, acepta_novedades, created_at'
    )
    .order('created_at', { ascending: true })

  if (soloConsentidos) query = query.eq('acepta_novedades', true)

  const { data, error } = await query
  if (error) {
    console.error('[sorteo/export]', error)
    return NextResponse.json({ error: 'No pudimos generar el archivo.' }, { status: 500 })
  }

  const encabezado = [
    'Nombre', 'WhatsApp', 'Barrio', 'Modalidad', 'Ticket',
    'Monto', 'Chances', 'Origen', 'Acepta novedades', 'Fecha',
  ]

  const filas = (data ?? []).map(p => [
    p.nombre,
    formatearTelefono(p.telefono),
    p.barrio ?? '',
    p.modalidad === 'con_compra' ? 'Con compra' : 'Sin compra',
    p.ticket_numero ?? '',
    p.monto_compra ?? '',
    p.chances,
    p.origen ?? '',
    p.acepta_novedades ? 'Sí' : 'No',
    new Date(p.created_at).toLocaleString('es-AR'),
  ])

  // BOM al inicio para que Excel en español abra los acentos correctamente.
  const contenido =
    '﻿' + [encabezado, ...filas].map(f => f.map(csv).join(';')).join('\r\n')

  const sufijo = soloConsentidos ? 'consentidos' : 'todos'

  return new NextResponse(contenido, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="participantes-sorteo-${sufijo}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
