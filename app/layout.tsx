import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/ui/ServiceWorkerRegister'
import { ToastProvider } from '@/components/ui/Toast'
import { InstallPWA } from '@/components/ui/InstallPWA'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'alquiler de autos para Uber',
    'auto para trabajar en Cabify',
    'conductores de aplicaciones',
    'propietarios de vehículos',
    'remis Neuquén',
    'intermediación vehicular',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  manifest: '/manifest.json',
  icons: {
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

// No se bloquea el zoom: las personas con baja visión necesitan poder ampliar la pantalla.
export const viewport: Viewport = {
  themeColor: '#4455E0',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={nunito.variable}>
      <body className="font-nunito bg-calm-50 min-h-screen antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-calm-800 focus:font-bold focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg"
        >
          Saltar al contenido principal
        </a>
        <ToastProvider>
          <ServiceWorkerRegister />
          {children}
          <InstallPWA />
        </ToastProvider>
      </body>
    </html>
  )
}
