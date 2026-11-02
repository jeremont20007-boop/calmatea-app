import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solicitar creatividad',
  description: 'Elegí un plan de diseño profesional para tu anuncio y los formatos que querés recibir.',
}

export default function CreatividadLayout({ children }: { children: React.ReactNode }) {
  return children
}
