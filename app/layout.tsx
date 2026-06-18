import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { ServiceWorkerRegister } from '@/components/ui/ServiceWorkerRegister'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'CalmaTEA – Calma y rutinas para niños con autismo',
  description: 'Sonidos relajantes, rutinas visuales y seguimiento emocional para niños con TEA.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CalmaTEA',
  },
}

export const viewport: Viewport = {
  themeColor: '#6BA3BE',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={nunito.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-nunito bg-calm-50 min-h-screen antialiased">
        <ServiceWorkerRegister />
        <SplashScreen />
        {children}
      </body>
    </html>
  )
}
