'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { UserRole } from '@/types'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<UserRole>('conductor')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'propietario' || roleParam === 'conductor') {
      setRole(roleParam)
    }
  }, [searchParams])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, city, phone },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
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
          <p className="text-calm-500 mt-1 font-semibold">Crea tu cuenta gratis</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-calm-100 space-y-5">
          {/* Role selector */}
          <div>
            <p className="text-sm font-semibold text-calm-700 mb-3">Soy...</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('conductor')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  role === 'conductor'
                    ? 'border-calm-500 bg-calm-50 text-calm-700'
                    : 'border-calm-100 text-calm-400 hover:border-calm-300'
                }`}
              >
                <span className="text-3xl">🧑‍💼</span>
                <span className="font-extrabold text-sm">Conductor</span>
                <span className="text-xs text-center leading-tight">Busco vehículo para trabajar</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('propietario')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  role === 'propietario'
                    ? 'border-calm-500 bg-calm-50 text-calm-700'
                    : 'border-calm-100 text-calm-400 hover:border-calm-300'
                }`}
              >
                <span className="text-3xl">🚗</span>
                <span className="font-extrabold text-sm">Propietario</span>
                <span className="text-xs text-center leading-tight">Tengo vehículo, busco conductor</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              id="fullName"
              type="text"
              label="Nombre completo"
              placeholder="María García"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
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
              id="phone"
              type="tel"
              label="Teléfono"
              placeholder="+52 55 1234 5678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoComplete="tel"
            />
            <Input
              id="city"
              type="text"
              label="Ciudad"
              placeholder="Ciudad de México"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
            <Input
              id="password"
              type="password"
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? 'Creando cuenta...' : `Crear cuenta como ${role === 'conductor' ? 'conductor' : 'propietario'}`}
            </Button>
          </form>

          <p className="text-center text-xs text-calm-400">
            Al registrarte aceptas nuestros términos de uso y política de privacidad.
          </p>

          <p className="text-center text-calm-500 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="font-bold text-calm-600 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
