import type { SupabaseClient } from '@supabase/supabase-js'

/** Precio mensual del plan premium, en pesos, según el rol. */
export const PREMIUM_PRICE_ARS = {
  conductor: 2990,
  propietario: 3990,
} as const

export function getPremiumPriceARS(role: string | null | undefined): number | null {
  if (role === 'conductor' || role === 'propietario') return PREMIUM_PRICE_ARS[role]
  return null
}

/** Marca el perfil como premium. Devuelve el error de Supabase, si lo hubo. */
export async function activatePremium(supabase: SupabaseClient, profileId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ plan: 'premium', subscription_status: 'active' })
    .eq('id', profileId)
  return error
}
