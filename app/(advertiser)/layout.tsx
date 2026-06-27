import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Megaphone } from 'lucide-react'

const ADV_NAV = [
  { href: '/ad-dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/anuncios', label: 'Mis anuncios', icon: Megaphone },
]

export default async function AdvertiserLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/publicitario')

  const { data: advertiser } = await supabase
    .from('advertisers')
    .select('id, company_name, status')
    .eq('user_id', user.id)
    .single()

  if (!advertiser) redirect('/auth/publicitario')

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-white">
      <header className="sticky top-0 z-40 bg-calm-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone size={18} />
          <div>
            <p className="font-extrabold text-sm leading-tight">Publicitario</p>
            <p className="text-calm-300 text-[10px] font-semibold truncate max-w-[180px]">
              {advertiser.company_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {advertiser.status === 'pending' && (
            <span className="text-[10px] bg-yellow-400/20 text-yellow-200 font-bold px-2 py-0.5 rounded-full">
              En revisión
            </span>
          )}
          <Link href="/auth/login" className="text-xs text-calm-300 hover:text-white transition-colors">
            Salir
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-calm-700 border-t border-calm-600 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
          {ADV_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl text-calm-300 hover:text-white transition-colors"
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
