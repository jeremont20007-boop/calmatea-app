'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main id="contenido" className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-calm-50 to-calm-100 text-center">
      <div className="text-7xl mb-4" aria-hidden="true">😔</div>
      <div role="alert">
        <h1 className="text-2xl font-extrabold text-calm-800 mb-2">Algo salió mal</h1>
        <p className="text-calm-600 font-semibold mb-8">Vamos a intentarlo de nuevo</p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="bg-calm-500 text-white font-extrabold px-6 py-3 rounded-2xl hover:bg-calm-600 transition-colors"
      >
        Reintentar
      </button>
    </main>
  )
}
