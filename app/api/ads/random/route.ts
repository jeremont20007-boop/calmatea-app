import { NextResponse } from 'next/server'
import { pickRandomAd } from '@/lib/ads'

// Cada pedido elige un anuncio distinto y cuenta una impresión: nunca cachear.
export const dynamic = 'force-dynamic'

export async function GET() {
  const ad = await pickRandomAd()
  return NextResponse.json({ ad }, { headers: { 'Cache-Control': 'no-store' } })
}
