import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Car, Users, ArrowRight, Star, Shield, Zap } from 'lucide-react'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
}

// Datos estructurados (JSON-LD) para que Google entienda qué es el sitio.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organizacion`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
      areaServed: { '@type': 'City', name: 'Neuquén' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#sitio`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'es-AR',
      publisher: { '@id': `${SITE_URL}/#organizacion` },
    },
  ],
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-calm-50 via-white to-calm-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 rounded-lg">
          <span className="text-2xl" aria-hidden="true">🚗</span>
          <span className="text-xl font-extrabold text-calm-800">VehiLink</span>
        </Link>
        <nav aria-label="Cuenta" className="flex gap-3">
          <Link href="/auth/login" className="text-calm-600 font-semibold text-sm hover:underline py-2 px-3">
            Entrar
          </Link>
          <Link href="/auth/register" className="bg-calm-500 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-calm-600 transition-colors">
            Registrarse
          </Link>
        </nav>
      </header>

      <main id="contenido" className="max-w-2xl mx-auto px-6 pb-20 space-y-16">
        {/* Hero */}
        <section className="pt-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-calm-100 text-calm-700 text-sm font-bold px-4 py-2 rounded-full">
            <Zap size={14} aria-hidden="true" />
            Plataforma de intermediación vehicular
          </div>
          <h1 className="text-4xl font-extrabold text-calm-900 leading-tight">
            Conectamos conductores con propietarios de vehículos de plataformas digitales
          </h1>
          <p className="text-calm-600 text-lg font-semibold max-w-md mx-auto leading-relaxed">
            ¿Tenés un vehículo en Uber o Cabify pero no lo manejás? ¿Querés trabajar en plataformas pero no tenés auto? <strong>VehiLink</strong> es tu solución.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register?role=conductor"
              className="bg-calm-500 text-white font-extrabold text-lg px-8 py-4 rounded-2xl hover:bg-calm-600 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Soy conductor <ArrowRight size={20} aria-hidden="true" />
            </Link>
            <Link
              href="/auth/register?role=propietario"
              className="bg-white text-calm-700 font-bold text-lg px-8 py-4 rounded-2xl border-2 border-calm-200 hover:border-calm-400 transition-all flex items-center justify-center gap-2"
            >
              Tengo un vehículo <Car size={20} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section aria-label="VehiLink en números" className="grid grid-cols-3 gap-4">
          {[
            { value: '2.400+', label: 'Vehículos activos' },
            { value: '8.900+', label: 'Conductores registrados' },
            { value: '95%', label: 'Acuerdos exitosos' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 text-center border border-calm-100 shadow-sm">
              <p className="text-2xl font-extrabold text-calm-500">{s.value}</p>
              <p className="text-xs text-calm-600 mt-1 font-semibold">{s.label}</p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section aria-labelledby="como-funciona" className="space-y-6">
          <h2 id="como-funciona" className="text-2xl font-extrabold text-calm-800 text-center">¿Cómo funciona?</h2>
          <ol className="space-y-4">
            {[
              {
                step: '1',
                icon: '📝',
                title: 'Registrate según tu rol',
                desc: 'Creá tu perfil como conductor o como propietario de vehículo en menos de 2 minutos.',
              },
              {
                step: '2',
                icon: '🔍',
                title: 'Publicá o buscá',
                desc: 'Los propietarios publican sus vehículos. Los conductores exploran y se postulan a los que les interesen.',
              },
              {
                step: '3',
                icon: '🤝',
                title: 'Conectá y acordá',
                desc: 'El propietario acepta la solicitud y coordinan los términos del acuerdo directamente.',
              },
            ].map(item => (
              <li key={item.step} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-calm-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-calm-500 text-white flex items-center justify-center font-extrabold text-lg shrink-0" aria-hidden="true">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-extrabold text-calm-800">
                    <span className="text-xl mr-2" aria-hidden="true">{item.icon}</span>
                    <span className="sr-only">Paso {item.step}: </span>
                    {item.title}
                  </h3>
                  <p className="text-sm text-calm-600 mt-1">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* For both personas */}
        <section aria-label="Beneficios para cada perfil" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* For drivers */}
          <div className="bg-gradient-to-br from-calm-500 to-calm-700 rounded-3xl p-6 text-white space-y-4">
            <div className="text-4xl" aria-hidden="true">🧑‍💼</div>
            <h2 className="text-xl font-extrabold">Para conductores</h2>
            <ul className="space-y-2">
              {[
                'Trabajá en Uber, Cabify y más sin comprar auto',
                'Elegí tu horario y ciudad',
                'Conocé el porcentaje antes de postularte',
                'Sin compromisos a largo plazo',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-calm-100">
                  <Check size={14} className="shrink-0 mt-0.5 text-sunshine" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/register?role=conductor" className="block text-center bg-white text-calm-700 font-extrabold py-3 rounded-xl hover:opacity-90 transition-opacity">
              Buscar vehículo <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* For owners */}
          <div className="bg-gradient-to-br from-emerald-700 to-green-800 rounded-3xl p-6 text-white space-y-4">
            <div className="text-4xl" aria-hidden="true">🚗</div>
            <h2 className="text-xl font-extrabold">Para propietarios</h2>
            <ul className="space-y-2">
              {[
                'Tu auto genera ingresos sin que manejes',
                'Vos definís el porcentaje y las condiciones',
                'Conductores verificados y calificados',
                'Gestioná todo desde la app',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-green-100">
                  <Check size={14} className="shrink-0 mt-0.5 text-sunshine" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/register?role=propietario" className="block text-center bg-white text-green-700 font-extrabold py-3 rounded-xl hover:opacity-90 transition-opacity">
              Publicar mi vehículo <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        {/* Trust indicators */}
        <section aria-labelledby="por-que" className="space-y-4">
          <h2 id="por-que" className="text-2xl font-extrabold text-calm-800 text-center">¿Por qué VehiLink?</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Shield, label: 'Perfiles verificados', desc: 'Validamos licencias y documentos' },
              { icon: Star, label: 'Calificaciones', desc: 'Sistema de reputación mutuo' },
              { icon: Zap, label: 'Proceso rápido', desc: 'Acuerdo en menos de 24 h' },
              { icon: Users, label: 'Comunidad activa', desc: 'Miles de acuerdos exitosos' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white rounded-2xl p-4 border border-calm-100 shadow-sm">
                <Icon size={24} className="text-calm-500 mb-2" aria-hidden="true" />
                <h3 className="font-extrabold text-calm-800 text-sm">{label}</h3>
                <p className="text-xs text-calm-600 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-calm-800 text-white rounded-3xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-extrabold">Empezá hoy, gratis</h2>
          <p className="text-calm-200 text-sm">Sin tarjeta de crédito. Sin compromisos.</p>
          <Link
            href="/auth/register"
            className="inline-block bg-sunshine text-calm-900 font-extrabold py-4 px-8 rounded-2xl hover:opacity-90 transition-opacity"
          >
            Crear cuenta gratis <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      <footer className="text-center py-8 text-calm-600 text-sm">
        <p>© 2026 VehiLink · Todos los derechos reservados</p>
      </footer>
    </div>
  )
}
