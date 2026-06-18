import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-calm-50 to-calm-100 text-center">
      <div className="text-7xl mb-4">🌊</div>
      <h1 className="text-3xl font-extrabold text-calm-800 mb-2">Página no encontrada</h1>
      <p className="text-calm-500 font-semibold mb-8">Esta ola se perdió en el mar</p>
      <Link
        href="/dashboard"
        className="bg-calm-400 text-white font-extrabold px-6 py-3 rounded-2xl hover:bg-calm-500 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
