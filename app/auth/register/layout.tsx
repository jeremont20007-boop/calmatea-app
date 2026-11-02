import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear cuenta gratis',
  description:
    'Registrate gratis en VehiLink como conductor o como propietario de vehículo y empezá a trabajar con Uber, Cabify, remis y otras plataformas en Neuquén.',
  alternates: { canonical: '/auth/register' },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
