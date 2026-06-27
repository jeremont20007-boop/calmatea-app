'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TopBar } from '@/components/layout/TopBar'
import type { Profile } from '@/types'

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setProfile(data as unknown as Profile)
        setFullName(data.full_name || '')
        setCity(data.city || '')
        setPhone(data.phone || '')
        setLicenseNumber(data.license_number || '')
        setExperienceYears(data.experience_years?.toString() || '')
        setBio(data.bio || '')
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const updates: Record<string, unknown> = {
      full_name: fullName.trim(),
      city: city.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
    }

    if (profile?.role === 'conductor') {
      updates.license_number = licenseNumber.trim() || null
      updates.experience_years = experienceYears ? parseInt(experienceYears) : null
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)

    setSaving(false)
    if (updateError) {
      setError('Error al guardar los cambios')
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <TopBar title="Mi perfil" showBack backHref="/dashboard" />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-calm-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Mi perfil" showBack backHref="/dashboard" />

      <form onSubmit={handleSave} className="p-4 space-y-5 pb-8">
        {/* Avatar & role */}
        <div className="bg-white rounded-3xl p-5 border border-calm-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-calm-100 flex items-center justify-center text-3xl shrink-0">
            {profile?.role === 'conductor' ? '🧑‍💼' : '🚗'}
          </div>
          <div>
            <p className="font-extrabold text-calm-800 text-lg">{fullName || 'Tu nombre'}</p>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              profile?.role === 'conductor'
                ? 'bg-calm-100 text-calm-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {profile?.role === 'conductor' ? 'Conductor' : 'Propietario'}
            </span>
          </div>
        </div>

        {/* Personal info */}
        <div className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
          <h2 className="font-extrabold text-calm-800">Información personal</h2>
          <Input
            id="fullName"
            label="Nombre completo"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
          <Input
            id="city"
            label="Ciudad"
            placeholder="Ciudad de México"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
          <Input
            id="phone"
            label="Teléfono"
            type="tel"
            placeholder="+52 55 1234 5678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        {/* Conductor-specific fields */}
        {profile?.role === 'conductor' && (
          <div className="bg-white rounded-3xl p-5 border border-calm-100 space-y-4">
            <h2 className="font-extrabold text-calm-800">Información como conductor</h2>
            <Input
              id="licenseNumber"
              label="Número de licencia"
              placeholder="B1234567"
              value={licenseNumber}
              onChange={e => setLicenseNumber(e.target.value)}
            />
            <Input
              id="experienceYears"
              label="Años de experiencia en plataformas"
              type="number"
              placeholder="3"
              min="0"
              max="30"
              value={experienceYears}
              onChange={e => setExperienceYears(e.target.value)}
            />
            <div>
              <label className="block text-sm font-semibold text-calm-700 mb-1.5">
                Presentación / Bio
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Cuéntale a los propietarios sobre tu experiencia, tu estilo de trabajo y por qué eres el conductor ideal..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-calm-200 bg-white text-calm-800 font-medium placeholder:text-calm-300 focus:outline-none focus:border-calm-400 transition-colors text-sm resize-none"
              />
            </div>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold">
            ✓ Cambios guardados correctamente
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3 text-calm-400 font-semibold text-sm hover:text-red-500 transition-colors"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  )
}
