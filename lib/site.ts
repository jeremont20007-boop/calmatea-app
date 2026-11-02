/**
 * Datos generales del sitio usados para SEO (metadata, sitemap, robots, JSON-LD).
 *
 * La URL pública se toma de NEXT_PUBLIC_APP_URL (configurar en Vercel con el
 * dominio definitivo, por ejemplo https://www.vehilink.com.ar). Si no está
 * configurada, se usa el dominio de producción que Vercel asigna
 * automáticamente y, como último recurso, localhost.
 */
function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProd) return `https://${vercelProd}`
  return 'http://localhost:3000'
}

export const SITE_URL = resolveSiteUrl()

export const SITE_NAME = 'VehiLink'

export const SITE_TITLE = 'VehiLink – Conectamos conductores con propietarios de vehículos'

export const SITE_DESCRIPTION =
  'La plataforma que conecta conductores con propietarios de vehículos registrados en Uber, Cabify, Beat, inDrive, remis y más. Publicá tu auto o encontrá uno para trabajar en Neuquén.'
