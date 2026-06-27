'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Car, FileText, User, Search } from 'lucide-react'
import type { UserRole } from '@/types'

interface BottomNavProps {
  role: UserRole
}

const CONDUCTOR_NAV = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/vehiculos', label: 'Buscar', icon: Search },
  { href: '/solicitudes', label: 'Solicitudes', icon: FileText },
  { href: '/perfil', label: 'Perfil', icon: User },
]

const PROPIETARIO_NAV = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/mis-vehiculos', label: 'Mis Autos', icon: Car },
  { href: '/solicitudes', label: 'Solicitudes', icon: FileText },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()
  const navItems = role === 'propietario' ? PROPIETARIO_NAV : CONDUCTOR_NAV

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-calm-100 safe-bottom z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[56px]',
                active
                  ? 'text-calm-500 bg-calm-50'
                  : 'text-calm-400 hover:text-calm-500'
              )}
            >
              <Icon size={22} strokeWidth={2} />
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
