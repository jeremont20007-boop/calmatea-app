import { createClient } from '@/lib/supabase/server'
import { DRIVER_DOC_LABELS, VEHICLE_DOC_LABELS, type DriverDocType, type VehicleDocType } from '@/types'
import { Eye } from 'lucide-react'
import { DocReviewActions } from './DocReviewActions'

export default async function AdminDocumentosPage() {
  const supabase = await createClient()

  const [{ data: driverDocs }, { data: vehicleDocs }] = await Promise.all([
    supabase
      .from('driver_documents')
      .select('id, doc_type, file_url, status, notes, uploaded_at, driver:profiles!driver_id(full_name, role)')
      .eq('status', 'pendiente')
      .order('uploaded_at', { ascending: true }),
    supabase
      .from('vehicle_documents')
      .select('id, doc_type, file_url, status, notes, uploaded_at, vehicle:vehicles!vehicle_id(make, model, year, owner:profiles!owner_id(full_name))')
      .eq('status', 'pendiente')
      .order('uploaded_at', { ascending: true }),
  ])

  const driverPending = driverDocs ?? []
  const vehiclePending = vehicleDocs ?? []
  const total = driverPending.length + vehiclePending.length

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-calm-800">Revisión de documentos</h1>
        <p className="text-sm text-calm-500 mt-0.5">{total} documento{total !== 1 ? 's' : ''} pendiente{total !== 1 ? 's' : ''}</p>
      </div>

      {total === 0 && (
        <div className="text-center py-16 text-calm-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-bold">No hay documentos pendientes</p>
        </div>
      )}

      {/* Driver documents */}
      {driverPending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-calm-600 px-1">Documentos de conductores ({driverPending.length})</h2>
          {driverPending.map((doc) => {
            const driver = (doc as unknown as { driver: { full_name: string } }).driver
            const label = DRIVER_DOC_LABELS[doc.doc_type as DriverDocType]?.label ?? doc.doc_type
            return (
              <div key={doc.id} className="bg-white border border-calm-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-calm-800 text-sm">{label}</p>
                    <p className="text-xs text-calm-500">{driver?.full_name}</p>
                    <p className="text-xs text-calm-400">{new Date(doc.uploaded_at).toLocaleDateString('es-AR')}</p>
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-calm-500 hover:text-calm-700 bg-calm-50 px-2.5 py-1.5 rounded-lg">
                      <Eye size={12} /> Ver
                    </a>
                  )}
                </div>
                <DocReviewActions docId={doc.id} table="driver_documents" currentStatus={doc.status} />
              </div>
            )
          })}
        </section>
      )}

      {/* Vehicle documents */}
      {vehiclePending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-calm-600 px-1">Documentos de vehículos ({vehiclePending.length})</h2>
          {vehiclePending.map((doc) => {
            const vehicle = (doc as unknown as { vehicle: { make: string; model: string; year: number; owner: { full_name: string } } }).vehicle
            const label = VEHICLE_DOC_LABELS[doc.doc_type as VehicleDocType]?.label ?? doc.doc_type
            return (
              <div key={doc.id} className="bg-white border border-calm-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-calm-800 text-sm">{label}</p>
                    <p className="text-xs text-calm-500">{vehicle?.make} {vehicle?.model} {vehicle?.year}</p>
                    <p className="text-xs text-calm-400">{vehicle?.owner?.full_name} · {new Date(doc.uploaded_at).toLocaleDateString('es-AR')}</p>
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-calm-500 hover:text-calm-700 bg-calm-50 px-2.5 py-1.5 rounded-lg">
                      <Eye size={12} /> Ver
                    </a>
                  )}
                </div>
                <DocReviewActions docId={doc.id} table="vehicle_documents" currentStatus={doc.status} />
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
