'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SignOutButtonProps {
  /** A dónde ir después de cerrar la sesión. */
  redirectTo?: string
  label?: string
  className?: string
}

/** Cierra la sesión de Supabase y lleva a la página indicada. */
export function SignOutButton({
  redirectTo = '/auth/login',
  label = 'Salir',
  className = 'text-xs text-calm-300 hover:text-white transition-colors disabled:opacity-60',
}: SignOutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <button type="button" onClick={handleSignOut} disabled={loading} className={className}>
      {loading ? 'Saliendo...' : label}
    </button>
  )
}
