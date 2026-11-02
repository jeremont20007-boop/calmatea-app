import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear anuncio',
  description: 'Creá un anuncio en VehiLink: cargá tus imágenes, escribí el contenido y elegí la duración de la campaña.',
}

export default function NuevoAnuncioLayout({ children }: { children: React.ReactNode }) {
  return children
}
