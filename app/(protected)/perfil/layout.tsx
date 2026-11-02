import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mi perfil',
  description: 'Editá tus datos personales, tu disponibilidad y tu presentación en VehiLink.',
}

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return children
}
