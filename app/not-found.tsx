import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'La página que buscás no existe o fue movida.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main id="contenido" className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-calm-50 to-calm-100 text-center">
      <div className="text-7xl mb-4" aria-hidden="true">🌊</div>
      <h1 className="text-3xl font-extrabold text-calm-800 mb-2">Página no encontrada</h1>
      <p className="text-calm-600 font-semibold mb-8">Esta ola se perdió en el mar</p>
      <Link
        href="/dashboard"
        className="bg-calm-500 text-white font-extrabold px-6 py-3 rounded-2xl hover:bg-calm-600 transition-colors"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
