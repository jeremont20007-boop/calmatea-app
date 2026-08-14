import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Ticket, FileText, Users, Megaphone, Sparkles, Gift } from 'lucide-react'

const ADMIN_NAV = [
  { href: '/admin/dashboard',    label: 'Panel',     icon: LayoutDashboard },
  { href: '/admin/sorteo',       label: 'Sorteo',    icon: Gift },
  { href: '/admin/tickets',      label: 'Tickets',   icon: Ticket },
  { href: '/admin/documentos',   label: 'Docs',      icon: FileText },
  { href: '/admin/usuarios',     label: 'Usuarios',  icon: Users },
  { href: '/admin/publicidad',   label: 'Anuncios',  icon: Megaphone },
  { href: '/admin/creatividad',  label: 'Creatividad', icon: Sparkles },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto bg-white">
      {/* Admin top nav */}
      <header className="sticky top-0 z-40 bg-calm-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <span className="font-extrabold text-sm tracking-wide">VehiLink Admin</span>
        </div>
        <Link href="/dashboard" className="text-xs text-calm-300 hover:text-white transition-colors">
          ← Salir
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-calm-800 border-t border-calm-700 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-2">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-calm-300 hover:text-white transition-colors min-w-[56px]"
            >
              <Icon size={20} strokeWidth={2} />
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
