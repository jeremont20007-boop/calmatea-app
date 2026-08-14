import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

const ROLE_BADGE: Record<string, string> = {
  conductor: 'bg-calm-100 text-calm-700',
  propietario: 'bg-green-100 text-green-700',
  admin: 'bg-purple-100 text-purple-700',
}

export default async function AdminUsuariosPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role, plan, city, phone, created_at')
    .order('created_at', { ascending: false })

  const list = (users ?? []) as unknown as Profile[]

  const conductores = list.filter(u => u.role === 'conductor')
  const propietarios = list.filter(u => u.role === 'propietario')
  const admins = list.filter(u => u.role === 'admin')

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-calm-800">Usuarios</h1>
        <p className="text-sm text-calm-500 mt-0.5">
          {conductores.length} conductores · {propietarios.length} propietarios · {admins.length} admins
        </p>
      </div>

      <div className="space-y-2">
        {list.map(u => (
          <div key={u.id} className="bg-white border border-calm-100 rounded-2xl p-3.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-calm-800 text-sm">{u.full_name || '(sin nombre)'}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-500'}`}>
                  {u.role}
                </span>
                {u.plan === 'premium' && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Premium</span>
                )}
              </div>
              {u.city && <p className="text-xs text-calm-400 mt-0.5">📍 {u.city}</p>}
              {u.phone && <p className="text-xs text-calm-400">📞 {u.phone}</p>}
            </div>
            <p className="text-xs text-calm-400 shrink-0">{new Date(u.created_at).toLocaleDateString('es-AR')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
