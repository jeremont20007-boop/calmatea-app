import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/auth/login', '/auth/register', '/auth/publicitario'],
      disallow: [
        '/api/',
        '/auth/callback',
        '/admin/',
        '/dashboard',
        '/vehiculos',
        '/mis-vehiculos',
        '/solicitudes',
        '/soporte',
        '/perfil',
        '/subscription',
        '/calificar',
        '/anuncios',
        '/ad-dashboard',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
