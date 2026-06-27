import Link from 'next/link'
import { Check, Car, Users, ArrowRight, Star, Shield, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-calm-50 via-white to-calm-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚗</span>
          <span className="text-xl font-extrabold text-calm-800">VehiLink</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="text-calm-600 font-semibold text-sm hover:underline py-2 px-3">
            Entrar
          </Link>
          <Link href="/auth/register" className="bg-calm-500 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-calm-600 transition-colors">
            Registrarse
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-20 space-y-16">
        {/* Hero */}
        <section className="pt-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-calm-100 text-calm-700 text-sm font-bold px-4 py-2 rounded-full">
            <Zap size={14} />
            Plataforma de intermediación vehicular
          </div>
          <h1 className="text-4xl font-extrabold text-calm-900 leading-tight">
            Conectamos conductores con propietarios de plataformas digitales
          </h1>
          <p className="text-calm-600 text-lg font-semibold max-w-md mx-auto leading-relaxed">
            ¿Tienes un vehículo en Uber o Cabify pero no conduces? ¿Quieres trabajar en plataformas pero no tienes auto? <strong>VehiLink</strong> es tu solución.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register?role=conductor"
              className="bg-calm-500 text-white font-extrabold text-lg px-8 py-4 rounded-2xl hover:bg-calm-600 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Soy conductor <ArrowRight size={20} />
            </Link>
            <Link
              href="/auth/register?role=propietario"
              className="bg-white text-calm-700 font-bold text-lg px-8 py-4 rounded-2xl border-2 border-calm-200 hover:border-calm-400 transition-all flex items-center justify-center gap-2"
            >
              Tengo un vehículo <Car size={20} />
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-4">
          {[
            { value: '2,400+', label: 'Vehículos activos' },
            { value: '8,900+', label: 'Conductores registrados' },
            { value: '95%', label: 'Acuerdos exitosos' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 text-center border border-calm-100 shadow-sm">
              <p className="text-2xl font-extrabold text-calm-500">{s.value}</p>
              <p className="text-xs text-calm-500 mt-1 font-semibold">{s.label}</p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="space-y-6">
          <h2 className="text-2xl font-extrabold text-calm-800 text-center">¿Cómo funciona?</h2>
          <div className="space-y-4">
            {[
              {
                step: '1',
                icon: '📝',
                title: 'Regístrate según tu rol',
                desc: 'Crea tu perfil como conductor o como propietario de vehículo en menos de 2 minutos.',
              },
              {
                step: '2',
                icon: '🔍',
                title: 'Publica o busca',
                desc: 'Los propietarios publican sus vehículos. Los conductores exploran y aplican a los que les interesen.',
              },
              {
                step: '3',
                icon: '🤝',
                title: 'Conecta y acuerda',
                desc: 'El propietario acepta la solicitud y coordinan los términos del acuerdo directamente.',
              },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-calm-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-calm-500 text-white flex items-center justify-center font-extrabold text-lg shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="text-xl mr-2 inline">{item.icon}</p>
                  <p className="font-extrabold text-calm-800 inline">{item.title}</p>
                  <p className="text-sm text-calm-500 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* For both personas */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* For drivers */}
          <div className="bg-gradient-to-br from-calm-500 to-calm-700 rounded-3xl p-6 text-white space-y-4">
            <div className="text-4xl">🧑‍💼</div>
            <h3 className="text-xl font-extrabold">Para conductores</h3>
            <ul className="space-y-2">
              {[
                'Trabaja en Uber, Cabify y más sin comprar auto',
                'Elige tu horario y ciudad',
                'Conoce el porcentaje antes de aplicar',
                'Sin compromisos a largo plazo',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-calm-100">
                  <Check size={14} className="shrink-0 mt-0.5 text-sunshine" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/register?role=conductor" className="block text-center bg-white text-calm-700 font-extrabold py-3 rounded-xl hover:opacity-90 transition-opacity">
              Buscar vehículo →
            </Link>
          </div>

          {/* For owners */}
          <div className="bg-gradient-to-br from-forest to-green-700 rounded-3xl p-6 text-white space-y-4">
            <div className="text-4xl">🚗</div>
            <h3 className="text-xl font-extrabold">Para propietarios</h3>
            <ul className="space-y-2">
              {[
                'Tu auto genera ingresos sin que manejes',
                'Tú defines el porcentaje y las condiciones',
                'Conductores verificados y calificados',
                'Gestiona todo desde la app',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-green-100">
                  <Check size={14} className="shrink-0 mt-0.5 text-sunshine" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/register?role=propietario" className="block text-center bg-white text-green-700 font-extrabold py-3 rounded-xl hover:opacity-90 transition-opacity">
              Publicar mi vehículo →
            </Link>
          </div>
        </section>

        {/* Trust indicators */}
        <section className="space-y-4">
          <h2 className="text-2xl font-extrabold text-calm-800 text-center">¿Por qué VehiLink?</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Shield, label: 'Perfiles verificados', desc: 'Validamos licencias y documentos' },
              { icon: Star, label: 'Calificaciones', desc: 'Sistema de reputación mutuo' },
              { icon: Zap, label: 'Proceso rápido', desc: 'Acuerdo en menos de 24h' },
              { icon: Users, label: 'Comunidad activa', desc: 'Miles de acuerdos exitosos' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white rounded-2xl p-4 border border-calm-100 shadow-sm">
                <Icon size={24} className="text-calm-400 mb-2" />
                <p className="font-extrabold text-calm-800 text-sm">{label}</p>
                <p className="text-xs text-calm-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-calm-800 text-white rounded-3xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-extrabold">Empieza hoy, gratis</h2>
          <p className="text-calm-300 text-sm">Sin tarjeta de crédito. Sin compromisos.</p>
          <Link
            href="/auth/register"
            className="inline-block bg-sunshine text-calm-900 font-extrabold py-4 px-8 rounded-2xl hover:opacity-90 transition-opacity"
          >
            Crear cuenta gratis →
          </Link>
        </section>
      </main>

      <footer className="text-center py-8 text-calm-400 text-sm">
        <p>© 2026 VehiLink · Todos los derechos reservados</p>
      </footer>
    </div>
  )
}
