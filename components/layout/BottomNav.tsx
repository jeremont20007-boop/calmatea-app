'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Music, Zap, ListChecks, LayoutDashboard, Users } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/sounds', label: 'Sonidos', icon: Music },
  { href: '/emergency', label: 'Calmarme', icon: Zap },
  { href: '/routines', label: 'Rutinas', icon: ListChecks },
  { href: '/parents', label: 'Padres', icon: Users },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-calm-100 safe-bottom z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const isEmergency = href === '/emergency'
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[56px]',
                isEmergency
                  ? 'bg-coral text-white shadow-lg scale-110 -mt-4'
                  : active
                  ? 'text-calm-500 bg-calm-50'
                  : 'text-calm-400 hover:text-calm-500'
              )}
            >
              <Icon size={isEmergency ? 24 : 22} strokeWidth={isEmergency ? 2.5 : 2} />
              <span className={cn('text-xs font-semibold', isEmergency && 'text-white')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
