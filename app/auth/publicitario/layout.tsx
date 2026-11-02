import type { Metadata } from 'next'

const title = 'Publicitá en VehiLink'
const description =
  'Anunciá tu empresa ante conductores y propietarios de vehículos de Neuquén. Creá tu cuenta de publicitario, cargá tu anuncio y elegí la duración de tu campaña.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/auth/publicitario' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'VehiLink',
    title,
    description,
    url: '/auth/publicitario',
    images: ['/opengraph-image'],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/twitter-image'] },
}

export default function PublicitarioLayout({ children }: { children: React.ReactNode }) {
  return children
}
