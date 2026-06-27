import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import type { UserRole } from '@/types'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role: UserRole = (profile?.role as UserRole) || 'conductor'

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <main className="flex-1 pb-24">
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  )
}
