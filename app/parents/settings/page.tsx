'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'
import { SOUNDS } from '@/lib/sounds'
import type { SoundCategory } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [favoriteSound, setFavoriteSound] = useState<SoundCategory>('rain')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('full_name, favorite_sound').eq('user_id', user.id).single()
      if (data) {
        setFullName(data.full_name || '')
        setFavoriteSound((data.favorite_sound as SoundCategory) || 'rain')
      }
    }
    load()
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ full_name: fullName, favorite_sound: favoriteSound }).eq('user_id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <main className="flex-1 pb-24">
        <TopBar title="Ajustes" showBack backHref="/parents" />

        <div className="p-4 space-y-5">
          <Card>
            <CardTitle className="mb-4">Tu perfil</CardTitle>
            <form onSubmit={save} className="space-y-4">
              <Input
                id="fullName"
                label="Nombre"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Tu nombre"
              />

              <div>
                <label className="block text-sm font-semibold text-calm-700 mb-2">
                  Sonido favorito (para emergencias)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SOUNDS.map(s => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setFavoriteSound(s.category)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        favoriteSound === s.category
                          ? 'border-calm-400 bg-calm-50'
                          : 'border-calm-100 bg-white'
                      }`}
                    >
                      <span className="text-2xl">{s.emoji}</span>
                      <span className="text-xs font-bold text-calm-600">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={saving}>
                {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar cambios'}
              </Button>
            </form>
          </Card>

          <Card>
            <CardTitle className="mb-3">Suscripción</CardTitle>
            <a href="/subscription" className="block">
              <Button variant="secondary" size="lg" className="w-full">
                Ver planes y suscripción
              </Button>
            </a>
          </Card>

          <Card>
            <CardTitle className="mb-3 text-red-600">Cerrar sesión</CardTitle>
            <Button variant="danger" size="lg" className="w-full" onClick={logout}>
              Cerrar sesión
            </Button>
          </Card>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
