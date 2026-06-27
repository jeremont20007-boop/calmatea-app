'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const dismissed = sessionStorage.getItem('pwa-dismissed')

    if (isStandalone || dismissed) return

    if (isIOSDevice) {
      setIsIOS(true)
      setVisible(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem('pwa-dismissed', '1')
    setVisible(false)
  }

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-calm-800 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        <div className="text-3xl shrink-0">🚗</div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm">Instala VehiLink</p>
          {isIOS ? (
            <p className="text-calm-200 text-xs mt-0.5">
              Pulsa <strong>Compartir</strong> → <strong>Añadir a pantalla de inicio</strong>
            </p>
          ) : (
            <p className="text-calm-200 text-xs mt-0.5">
              Accede sin abrir el navegador. Funciona offline.
            </p>
          )}
          {!isIOS && (
            <button
              onClick={install}
              className="mt-2 flex items-center gap-1.5 bg-calm-400 hover:bg-calm-300 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
            >
              <Download size={12} /> Instalar
            </button>
          )}
        </div>
        <button onClick={dismiss} className="text-calm-400 hover:text-white shrink-0">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
