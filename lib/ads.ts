import type { SupabaseClient } from '@supabase/supabase-js'

export interface PublicAd {
  id: string
  title: string
  description?: string
  mobile_image_url?: string
  desktop_image_url?: string
  target_url: string
  cta_text: string
  advertiser_name?: string
}

/**
 * Picks a random active ad that still has impressions left and counts one
 * impression for it. Shared by the /api/ads/random endpoint and by server
 * pages that render the banner directly (so it doesn't pop in after load).
 */
export async function pickRandomAd(supabase: SupabaseClient): Promise<PublicAd | null> {
  const now = new Date().toISOString()

  const { data: ads } = await supabase
    .from('ads')
    .select('id, title, description, mobile_image_url, desktop_image_url, target_url, cta_text, current_impressions, max_impressions, advertiser:advertisers(company_name)')
    .eq('status', 'active')
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .limit(10)

  if (!ads || ads.length === 0) return null

  // Filter out ads that reached max impressions
  const eligible = ads.filter(a => !a.max_impressions || a.current_impressions < a.max_impressions)
  if (eligible.length === 0) return null

  const picked = eligible[Math.floor(Math.random() * eligible.length)]

  await supabase
    .from('ads')
    .update({ current_impressions: picked.current_impressions + 1 })
    .eq('id', picked.id)

  const advertiser = picked.advertiser as unknown as { company_name: string } | null

  return {
    id: picked.id,
    title: picked.title,
    description: picked.description,
    mobile_image_url: picked.mobile_image_url,
    desktop_image_url: picked.desktop_image_url,
    target_url: picked.target_url,
    cta_text: picked.cta_text,
    advertiser_name: advertiser?.company_name,
  }
}
