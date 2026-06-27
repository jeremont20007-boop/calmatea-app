import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { DocumentUpload } from '@/components/ui/DocumentUpload'
import { DRIVER_DOC_LABELS, type DriverDocType, type DriverDocument } from '@/types'
import { ShieldCheck, AlertTriangle } from 'lucide-react'

const DOC_ORDER: DriverDocType[] = [
  'licencia_conducir',
  'dni_frente',
  'dni_dorso',
  'credencial_remis',
  'antecedentes_nacionales',
  'antecedentes_provinciales',
  'seguro_excedentes',
]

export default async function DriverDocumentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'conductor') redirect('/dashboard')

  const { data: docs } = await supabase
    .from('driver_documents')
    .select('doc_type, file_url, status')
    .eq('driver_id', profile.id)

  const docMap = Object.fromEntries(
    (docs ?? []).map(d => [d.doc_type, d as DriverDocument])
  )

  const requiredDocs = DOC_ORDER.filter(t => DRIVER_DOC_LABELS[t].required)
  const uploadedRequired = requiredDocs.filter(t => docMap[t]?.file_url)
  const allRequiredDone = uploadedRequired.length === requiredDocs.length

  return (
    <div className="flex flex-col">
      <TopBar title="Mis documentos" showBack backHref="/perfil" />

      <div className="p-4 space-y-5 pb-8">
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
                ? 'Todos los documentos obligatorios están cargados. En revisión por el equipo.'
                : `${uploadedRequired.length} de ${requiredDocs.length} documentos obligatorios cargados.`
              }
            </p>
          </div>
        </div>

        <Card>
          <h2 className="font-extrabold text-calm-800 mb-1">¿Por qué son necesarios?</h2>
          <p className="text-xs text-calm-500 leading-relaxed">
            Los propietarios de vehículos necesitan verificar que eres un conductor habilitado y con antecedentes limpios. Tus documentos son privados y solo se comparten con propietarios que acepten tu solicitud.
          </p>
        </Card>

        {/* Obligatorios */}
        <div className="space-y-3">
          <h2 className="font-extrabold text-calm-700 px-1">
            Documentos obligatorios <span className="text-red-400">*</span>
          </h2>
          {DOC_ORDER.filter(t => DRIVER_DOC_LABELS[t].required).map(docType => (
            <DocumentUpload
              key={docType}
              docType={docType}
              label={DRIVER_DOC_LABELS[docType].label}
              description={DRIVER_DOC_LABELS[docType].description}
              required
              existingUrl={docMap[docType]?.file_url}
              existingStatus={docMap[docType]?.status}
              entityId={profile.id}
              entityType="driver"
            />
          ))}
        </div>

        {/* Opcionales */}
        <div className="space-y-3">
          <h2 className="font-extrabold text-calm-700 px-1">
            Documentos opcionales
          </h2>
          <p className="text-xs text-calm-400 px-1">
            Cargar estos documentos aumenta tus probabilidades de ser aceptado por propietarios de remis o vehículos habilitados.
          </p>
          {DOC_ORDER.filter(t => !DRIVER_DOC_LABELS[t].required).map(docType => (
            <DocumentUpload
              key={docType}
              docType={docType}
              label={DRIVER_DOC_LABELS[docType].label}
              description={DRIVER_DOC_LABELS[docType].description}
              existingUrl={docMap[docType]?.file_url}
              existingStatus={docMap[docType]?.status}
              entityId={profile.id}
              entityType="driver"
            />
          ))}
        </div>

        <p className="text-xs text-calm-400 text-center px-4 leading-relaxed">
          Formato aceptado: PDF, JPG o PNG · Máximo 10 MB por archivo.<br />
          Los documentos son revisados manualmente por nuestro equipo en un plazo de 24–48 hs.
        </p>
      </div>
    </div>
  )
}
