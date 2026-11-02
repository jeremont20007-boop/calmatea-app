import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { BottomNav } from '@/components/layout/BottomNav'
import type { UserRole } from '@/types'

export const metadata: Metadata = {
  // Área privada: no se indexa en buscadores.
  robots: { index: false, follow: false },
}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    // Check if this user is an advertiser (no profiles row)
    const { data: advertiser } = await supabase
      .from('advertisers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (advertiser) redirect('/ad-dashboard')
    else redirect('/auth/login')
  }

  const role: UserRole = (profile?.role as UserRole) || 'conductor'

  if (role === 'admin') redirect('/admin/dashboard')

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <main id="contenido" className="flex-1 pb-24">
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  )
}
