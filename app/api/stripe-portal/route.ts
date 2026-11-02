import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

// SECURITY: previously this endpoint accepted any `customerId` from the form
// without checking login, so anyone could open another customer's billing
// portal. Now the customer id always comes from the logged-in user's profile.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url), 303)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  const customerId = profile?.stripe_customer_id
  if (!customerId) {
    return NextResponse.redirect(new URL('/subscription', request.url), 303)
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
  })

  return NextResponse.redirect(portalSession.url, 303)
}
