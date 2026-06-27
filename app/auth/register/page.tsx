'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GoogleButton } from '@/components/ui/GoogleButton'
import type { UserRole } from '@/types'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<'conductor' | 'propietario'>('conductor')
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

  const roleLabel = role === 'conductor' ? 'conductor' : 'propietario'

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

          {/* Google sign-up — passes the chosen role */}
          <GoogleButton
            label={`Registrarme como ${roleLabel} con Google`}
            role={role}
            isNew
          />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-calm-100" />
            <span className="text-xs text-calm-400 font-semibold">o con email</span>
            <div className="flex-1 h-px bg-calm-100" />
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
              placeholder="+54 299 123 4567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoComplete="tel"
            />
            <Input
              id="city"
              type="text"
              label="Ciudad"
              placeholder="Neuquén"
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
              {loading ? 'Creando cuenta...' : `Crear cuenta como ${roleLabel}`}
            </Button>
          </form>

          <p className="text-center text-xs text-calm-400">
            Al registrarte aceptás nuestros términos de uso y política de privacidad.
          </p>

          <p className="text-center text-calm-500 text-sm">
            ¿Ya tenés cuenta?{' '}
            <Link href="/auth/login" className="font-bold text-calm-600 hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>

        <p className="text-center mt-3">
          <Link
            href="/auth/publicitario"
            className="text-xs text-calm-300 hover:text-calm-500 transition-colors"
          >
            Publicita aquí
          </Link>
        </p>
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
