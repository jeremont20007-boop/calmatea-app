import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Ticket, FileText, Users, AlertCircle } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: openTickets },
    { count: pendingDocs },
    { count: totalUsers },
    { count: totalVehicles },
  ] = await Promise.all([
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'abierto'),
    supabase.from('driver_documents').select('id', { count: 'exact', head: true }).eq('status', 'pendiente'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'admin'),
    supabase.from('vehicles').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Tickets abiertos', value: openTickets ?? 0, href: '/admin/tickets', icon: Ticket, urgent: (openTickets ?? 0) > 0, color: 'text-red-600' },
    { label: 'Documentos pendientes', value: pendingDocs ?? 0, href: '/admin/documentos', icon: FileText, urgent: (pendingDocs ?? 0) > 0, color: 'text-yellow-600' },
    { label: 'Usuarios registrados', value: totalUsers ?? 0, href: '/admin/usuarios', icon: Users, urgent: false, color: 'text-calm-600' },
    { label: 'Vehículos publicados', value: totalVehicles ?? 0, href: '/admin/usuarios', icon: FileText, urgent: false, color: 'text-green-600' },
  ]

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-calm-800">Panel de administración</h1>
        <p className="text-sm text-calm-500 mt-0.5">Gestión de usuarios, documentos y soporte</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, href, icon: Icon, urgent, color }) => (
          <Link
            key={label}
            href={href}
            className={`bg-white rounded-2xl border-2 p-4 flex flex-col gap-2 hover:shadow-md transition-all ${
              urgent ? 'border-red-200 bg-red-50/30' : 'border-calm-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <Icon size={18} className={urgent ? 'text-red-500' : 'text-calm-400'} />
              {urgent && <AlertCircle size={14} className="text-red-400" />}
            </div>
            <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs text-calm-500 font-semibold leading-tight">{label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-calm-50 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-extrabold text-calm-600">Accesos rápidos</p>
        <div className="space-y-1">
          <Link href="/admin/tickets" className="flex items-center gap-2 text-sm text-calm-700 hover:text-calm-900 py-1.5">
            <Ticket size={14} /> Ver todos los tickets de soporte
          </Link>
          <Link href="/admin/documentos" className="flex items-center gap-2 text-sm text-calm-700 hover:text-calm-900 py-1.5">
            <FileText size={14} /> Revisar documentos pendientes
          </Link>
          <Link href="/admin/usuarios" className="flex items-center gap-2 text-sm text-calm-700 hover:text-calm-900 py-1.5">
            <Users size={14} /> Listar usuarios
          </Link>
        </div>
      </div>
    </div>
  )
}
