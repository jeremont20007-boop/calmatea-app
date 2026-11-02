import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Detalle del anuncio',
  description: 'Revisá el estado de tu anuncio, editá su contenido y completá el pago de la campaña.',
}

export default function AnuncioLayout({ children }: { children: React.ReactNode }) {
  return children
}
