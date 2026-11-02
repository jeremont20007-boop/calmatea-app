import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Sólo se listan páginas públicas: el resto requiere iniciar sesión
// y no debe aparecer en buscadores.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/auth/register`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/auth/publicitario`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/auth/login`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
  ]
}
