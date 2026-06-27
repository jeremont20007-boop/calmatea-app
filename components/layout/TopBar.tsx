'use client'

import Link from 'next/link'
import { Settings, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title: string
  showBack?: boolean
  backHref?: string
  rightAction?: React.ReactNode
  className?: string
}

export function TopBar({ title, showBack, backHref = '/dashboard', rightAction, className }: TopBarProps) {
  return (
    <header className={cn('flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-calm-100 safe-top sticky top-0 z-40', className)}>
      <div className="w-10">
        {showBack && (
          <Link href={backHref} className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-calm-100 transition-colors text-calm-600">
            <ChevronLeft size={24} />
          </Link>
        )}
      </div>
      <h1 className="text-lg font-extrabold text-calm-800">{title}</h1>
      <div className="w-10 flex justify-end">
        {rightAction || (
          <Link href="/perfil" className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-calm-100 transition-colors text-calm-400">
            <Settings size={20} />
          </Link>
        )}
      </div>
    </header>
  )
}
