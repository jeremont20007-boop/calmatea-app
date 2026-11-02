import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description:
    'Ingresá a tu cuenta de VehiLink para gestionar tus vehículos, solicitudes y acuerdos con conductores o propietarios.',
  alternates: { canonical: '/auth/login' },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
