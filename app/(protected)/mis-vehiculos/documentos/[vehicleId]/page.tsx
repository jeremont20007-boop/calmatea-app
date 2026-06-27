import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { DocumentUpload } from '@/components/ui/DocumentUpload'
import {
  VEHICLE_DOC_LABELS, VEHICLE_TYPE_LABELS,
  type VehicleDocType, type VehicleDocument, type Vehicle,
} from '@/types'
import { ShieldCheck, AlertTriangle } from 'lucide-react'

const DOC_ORDER: VehicleDocType[] = [
  'titulo_propiedad',
  'cedula_verde',
  'seguro_vehiculo',
  'habilitacion_remis',
  'habilitacion_taxi',
]

export default async function VehicleDocumentosPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>
}) {
  const { vehicleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'propietario') redirect('/dashboard')

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, make, model, year, vehicle_type, owner_id')
    .eq('id', vehicleId)
    .single()

  if (!vehicle || vehicle.owner_id !== profile.id) notFound()

  const v = vehicle as unknown as Vehicle

  const { data: docs } = await supabase
    .from('vehicle_documents')
    .select('doc_type, file_url, status')
    .eq('vehicle_id', vehicleId)

  const docMap = Object.fromEntries(
    (docs ?? []).map(d => [d.doc_type, d as VehicleDocument])
  )

  // Determine which docs are required based on vehicle type
  const isRemis = v.vehicle_type === 'remis'
  const isTaxi = v.vehicle_type === 'taxi'

  const requiredDocs: VehicleDocType[] = [
    'titulo_propiedad', 'cedula_verde', 'seguro_vehiculo',
    ...(isRemis ? ['habilitacion_remis' as VehicleDocType] : []),
    ...(isTaxi ? ['habilitacion_taxi' as VehicleDocType] : []),
  ]

  const uploadedRequired = requiredDocs.filter(t => docMap[t]?.file_url)
  const allRequiredDone = uploadedRequired.length === requiredDocs.length

  return (
    <div className="flex flex-col">
      <TopBar
        title="Documentos del vehículo"
        showBack
        backHref="/mis-vehiculos"
      />

      <div className="p-4 space-y-5 pb-8">
        {/* Vehicle summary */}
        <Card className="bg-calm-50">
          <p className="font-extrabold text-calm-800">
            {v.make} {v.model} {v.year}
          </p>
          <p className="text-xs text-calm-500 mt-0.5">
            Tipo: {VEHICLE_TYPE_LABELS[v.vehicle_type]}
          </p>
        </Card>

        {/* Status banner */}
        <div className={`rounded-2xl p-4 flex items-start gap-3 ${
          allRequiredDone
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          {allRequiredDone
            ? <ShieldCheck size={22} className="text-green-600 shrink-0 mt-0.5" />
            : <AlertTriangle size={22} className="text-yellow-600 shrink-0 mt-0.5" />
          }
          <div>
            <p className={`font-extrabold text-sm ${allRequiredDone ? 'text-green-800' : 'text-yellow-800'}`}>
              {allRequiredDone ? 'Documentación completa' : 'Documentación incompleta'}
            </p>
            <p className={`text-xs mt-0.5 ${allRequiredDone ? 'text-green-600' : 'text-yellow-600'}`}>
              {allRequiredDone
                ? 'Todos los documentos del vehículo están en revisión.'
                : `${uploadedRequired.length} de ${requiredDocs.length} documentos obligatorios cargados.`
              }
            </p>
          </div>
        </div>

        {/* Obligatorios */}
        <div className="space-y-3">
          <h2 className="font-extrabold text-calm-700 px-1">
            Documentos obligatorios <span className="text-red-400">*</span>
          </h2>
          {requiredDocs.map(docType => (
            <DocumentUpload
              key={docType}
              docType={docType}
              label={VEHICLE_DOC_LABELS[docType].label}
              description={VEHICLE_DOC_LABELS[docType].description}
              required
              existingUrl={docMap[docType]?.file_url}
              existingStatus={docMap[docType]?.status}
              entityId={vehicleId}
              entityType="vehicle"
            />
          ))}
        </div>

        {/* Opcionales (los que no son requeridos para este tipo de vehículo) */}
        {DOC_ORDER.filter(t => !requiredDocs.includes(t)).length > 0 && (
          <div className="space-y-3">
            <h2 className="font-extrabold text-calm-700 px-1">Documentos opcionales</h2>
            {DOC_ORDER.filter(t => !requiredDocs.includes(t)).map(docType => (
              <DocumentUpload
                key={docType}
                docType={docType}
                label={VEHICLE_DOC_LABELS[docType].label}
                description={VEHICLE_DOC_LABELS[docType].description}
                existingUrl={docMap[docType]?.file_url}
                existingStatus={docMap[docType]?.status}
                entityId={vehicleId}
                entityType="vehicle"
              />
            ))}
          </div>
        )}

        <p className="text-xs text-calm-400 text-center px-4 leading-relaxed">
          Los documentos son revisados en 24–48 hs. Se comparten solo con el conductor aceptado.
        </p>
      </div>
    </div>
  )
}
