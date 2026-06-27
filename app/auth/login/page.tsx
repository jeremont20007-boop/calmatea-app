'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-calm-50 to-calm-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🚗</div>
          <h1 className="text-3xl font-extrabold text-calm-800">VehiLink</h1>
          <p className="text-calm-500 mt-1 font-semibold">Intermediación vehicular de confianza</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-calm-100">
          <h2 className="text-xl font-extrabold text-calm-800 mb-5">Iniciar sesión</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Correo electrónico"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              id="password"
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center mt-4 text-calm-500 text-sm">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" className="font-bold text-calm-600 hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
