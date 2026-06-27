import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/ui/ServiceWorkerRegister'
import { ToastProvider } from '@/components/ui/Toast'
import { InstallPWA } from '@/components/ui/InstallPWA'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'VehiLink – Conectamos conductores con propietarios de vehículos',
  description: 'La plataforma que conecta conductores con propietarios de vehículos registrados en Uber, Cabify, Beat, InDriver y más.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VehiLink',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: '#4455E0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={nunito.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-nunito bg-calm-50 min-h-screen antialiased">
        <ToastProvider>
          <ServiceWorkerRegister />
          {children}
          <InstallPWA />
        </ToastProvider>
      </body>
    </html>
  )
}
