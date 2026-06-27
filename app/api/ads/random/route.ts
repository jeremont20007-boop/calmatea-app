import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: ads } = await supabase
    .from('ads')
    .select('id, title, description, image_url, target_url, cta_text, current_impressions, max_impressions, advertiser:advertisers(company_name)')
    .eq('status', 'active')
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .limit(10)

  if (!ads || ads.length === 0) return NextResponse.json({ ad: null })

  // Filter out ads that reached max impressions
  const eligible = ads.filter(a => !a.max_impressions || a.current_impressions < a.max_impressions)
  if (eligible.length === 0) return NextResponse.json({ ad: null })

  const picked = eligible[Math.floor(Math.random() * eligible.length)]

  await supabase
    .from('ads')
    .update({ current_impressions: picked.current_impressions + 1 })
    .eq('id', picked.id)

  const advertiser = picked.advertiser as unknown as { company_name: string } | null

  return NextResponse.json({
    ad: {
      id: picked.id,
      title: picked.title,
      description: picked.description,
      image_url: picked.image_url,
      target_url: picked.target_url,
      cta_text: picked.cta_text,
      advertiser_name: advertiser?.company_name,
    },
  })
}
