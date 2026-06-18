import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const customerId = formData.get('customerId') as string

  if (!customerId) {
    return NextResponse.redirect(new URL('/subscription', request.url))
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
  })

  return NextResponse.redirect(portalSession.url)
}
