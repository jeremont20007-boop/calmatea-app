import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Documentos personales (DNI, licencias, antecedentes, títulos…).
 *
 * Viven en el bucket PRIVADO "documents" de Supabase Storage. En la base
 * (columna file_url de driver_documents / vehicle_documents) se guarda sólo la
 * ubicación del archivo dentro del bucket, por ejemplo:
 *   driver/<id del perfil>/dni_frente.jpg
 *   vehicle/<id del vehículo>/cedula_verde.pdf
 * Para verlo se genera un link temporal firmado (createSignedUrl), que sólo
 * funciona si quien lo pide tiene permiso (ver
 * supabase/migrations/20261102_private_documents.sql).
 */
export const DOCUMENTS_BUCKET = 'documents'

/** Duración de los links para ver un documento (1 hora). */
export const DOCUMENT_LINK_SECONDS = 60 * 60

export const DOCUMENT_MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

export type DocumentEntityType = 'driver' | 'vehicle'

/** Ubicación del archivo dentro del bucket. La extensión sale del tipo real del archivo. */
export function buildDocumentPath(
  entityType: DocumentEntityType,
  entityId: string,
  docType: string,
  mimeType: string
): string | null {
  const ext = DOCUMENT_MIME_EXTENSIONS[mimeType]
  if (!ext) return null
  return `${entityType}/${entityId}/${docType}.${ext}`
}

const PUBLIC_PREFIX = `/storage/v1/object/public/${DOCUMENTS_BUCKET}/`
const SIGNED_PREFIX = `/storage/v1/object/sign/${DOCUMENTS_BUCKET}/`

/**
 * Convierte lo guardado en file_url a la ubicación dentro del bucket.
 * Acepta el formato nuevo (la ubicación) y el viejo (link público completo).
 * Devuelve null si no hay archivo (vacío o el marcador viejo "pending:…").
 */
export function documentPathFromFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl || fileUrl.startsWith('pending:')) return null

  if (/^https?:\/\//i.test(fileUrl)) {
    let pathname: string
    try {
      pathname = new URL(fileUrl).pathname
    } catch {
      return null
    }
    for (const prefix of [PUBLIC_PREFIX, SIGNED_PREFIX]) {
      if (pathname.startsWith(prefix)) {
        return decodeURIComponent(pathname.slice(prefix.length)) || null
      }
    }
    return null
  }

  return fileUrl.replace(/^\/+/, '') || null
}

/** ¿Hay un archivo subido para este documento? */
export function hasDocumentFile(fileUrl: string | null | undefined): boolean {
  return documentPathFromFileUrl(fileUrl) !== null
}

/**
 * Genera links temporales para ver varios documentos de una vez.
 * Devuelve un mapa file_url → link firmado. Los que no se pueden firmar
 * (sin permiso o archivo inexistente) simplemente no aparecen.
 */
export async function signDocumentUrls(
  supabase: SupabaseClient,
  fileUrls: (string | null | undefined)[]
): Promise<Record<string, string>> {
  const byPath = new Map<string, string>()
  for (const fileUrl of fileUrls) {
    const path = documentPathFromFileUrl(fileUrl)
    if (path && fileUrl) byPath.set(path, fileUrl)
  }
  if (byPath.size === 0) return {}

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrls([...byPath.keys()], DOCUMENT_LINK_SECONDS)

  if (error || !data) {
    console.error('[documents] no se pudieron generar los links', error)
    return {}
  }

  const result: Record<string, string> = {}
  for (const item of data) {
    const fileUrl = item.path ? byPath.get(item.path) : undefined
    if (fileUrl && item.signedUrl && !item.error) result[fileUrl] = item.signedUrl
  }
  return result
}
