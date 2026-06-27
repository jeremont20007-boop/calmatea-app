'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Megaphone } from 'lucide-react'

export default function PublicitarioAuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'register' | 'login'>('register')

  // Register fields
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setInfo('Revisá tu email para confirmar tu cuenta, luego iniciá sesión.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('advertisers').insert({
      user_id: userId,
      company_name: companyName.trim(),
      contact_email: email.trim(),
      phone: phone.trim() || null,
      website: website.trim() || null,
    })

    if (insertError) {
      setError('Error al crear el perfil de publicitario. Intentá de nuevo.')
      setLoading(false)
      return
    }

    router.push('/ad-dashboard')
    router.refresh()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/ad-dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-calm-50 to-calm-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-calm-500 flex items-center justify-center mx-auto mb-3">
            <Megaphone size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-calm-800">VehiLink Publicidad</h1>
          <p className="text-calm-500 mt-1 text-sm font-semibold">
            Alcanzá a conductores y propietarios de vehículos
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-calm-100 rounded-2xl p-1 mb-4">
          <button
            onClick={() => { setMode('register'); setError(''); setInfo('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-extrabold transition-all ${
              mode === 'register' ? 'bg-white text-calm-700 shadow-sm' : 'text-calm-400'
            }`}
          >
            Registrarse
          </button>
          <button
            onClick={() => { setMode('login'); setError(''); setInfo('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-extrabold transition-all ${
              mode === 'login' ? 'bg-white text-calm-700 shadow-sm' : 'text-calm-400'
            }`}
          >
            Iniciar sesión
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-calm-100 space-y-4">
          {mode === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-lg font-extrabold text-calm-800">Crear cuenta de publicitario</h2>
              <Input
                id="companyName"
                label="Empresa / Marca"
                placeholder="Remis Neuquén SRL"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
              />
              <Input
                id="email"
                type="email"
                label="Email de contacto"
                placeholder="publicidad@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                id="password"
                type="password"
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <Input
                id="phone"
                type="tel"
                label="Teléfono (opcional)"
                placeholder="+54 299 123 4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <Input
                id="website"
                type="url"
                label="Sitio web (opcional)"
                placeholder="https://miempresa.com"
                value={website}
                onChange={e => setWebsite(e.target.value)}
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
                  {error}
                </div>
              )}
              {info && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm font-semibold">
                  {info}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>

              <p className="text-xs text-calm-400 text-center">
                Los anuncios son revisados por nuestro equipo antes de publicarse.
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-lg font-extrabold text-calm-800">Entrar a mi cuenta</h2>
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="publicidad@empresa.com"
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

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-calm-500 mt-4">
          <Link href="/auth/login" className="text-calm-400 hover:underline font-semibold">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
