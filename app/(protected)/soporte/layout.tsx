import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Soporte',
  description: 'Enviá una consulta al equipo de VehiLink y seguí el estado de tus tickets de soporte.',
}

export default function SoporteLayout({ children }: { children: React.ReactNode }) {
  return children
}
