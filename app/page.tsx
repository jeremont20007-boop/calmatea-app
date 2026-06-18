import Link from 'next/link'
import { Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-calm-50 via-white to-calm-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🌊</span>
          <span className="text-xl font-extrabold text-calm-800">CalmaTEA</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="text-calm-600 font-semibold text-sm hover:underline py-2 px-3">
            Entrar
          </Link>
          <Link href="/auth/register" className="bg-calm-400 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-calm-500 transition-colors">
            Empezar gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-2xl mx-auto px-6 pt-12 pb-20 text-center space-y-8">
        <div className="space-y-4">
          <div className="text-7xl animate-breathe inline-block">🌊</div>
          <h1 className="text-4xl font-extrabold text-calm-900 leading-tight">
            Calma y rutinas para niños con autismo
          </h1>
          <p className="text-calm-600 text-lg font-semibold max-w-md mx-auto leading-relaxed">
            Sonidos relajantes, pictogramas visuales y seguimiento emocional para ayudar a tu peque a regularse.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/register"
            className="bg-calm-400 text-white font-extrabold text-lg px-8 py-4 rounded-2xl hover:bg-calm-500 transition-all shadow-lg hover:shadow-xl"
          >
            Empezar gratis →
          </Link>
          <Link
            href="/auth/login"
            className="bg-white text-calm-700 font-bold text-lg px-8 py-4 rounded-2xl border-2 border-calm-200 hover:border-calm-400 transition-all"
          >
            Ya tengo cuenta
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 pt-8">
          {[
            { emoji: '🎵', title: 'Sonidos relajantes', desc: 'Lluvia, mar, bosque y más' },
            { emoji: '⚡', title: 'Botón de calma', desc: 'Emergencias en un toque' },
            { emoji: '📋', title: 'Rutinas visuales', desc: 'Pictogramas paso a paso' },
            { emoji: '📊', title: 'Panel de padres', desc: 'Historial y emociones' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-4 text-left border border-calm-100 shadow-sm">
              <div className="text-3xl mb-2">{f.emoji}</div>
              <p className="font-extrabold text-calm-800 text-sm">{f.title}</p>
              <p className="text-xs text-calm-500 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing teaser */}
        <div className="bg-calm-800 text-white rounded-3xl p-6 text-left space-y-3">
          <p className="font-extrabold text-lg">🌟 Premium por 4,99€/mes</p>
          <ul className="space-y-1.5">
            {['Sonidos Bosque y Ruido Marrón', 'Rutinas de Baño y Dormir', 'Historial ilimitado', 'Reportes detallados'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-calm-200">
                <Check size={14} className="text-sunshine shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/auth/register" className="block text-center bg-sunshine text-calm-900 font-extrabold py-3 rounded-xl hover:opacity-90 transition-opacity mt-2">
            Probar gratis →
          </Link>
        </div>
      </main>
    </div>
  )
}
