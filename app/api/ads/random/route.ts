import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pickRandomAd } from '@/lib/ads'

export async function GET() {
  const supabase = await createClient()
  const ad = await pickRandomAd(supabase)
  return NextResponse.json({ ad })
}
