'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const noopSubscribe = () => () => {}

function readSessionDismissed() {
  try {
    return sessionStorage.getItem('pwa-dismissed') === '1'
  } catch {
    return false
  }
}

export function InstallPWA() {
  const isIOS = useSyncExternalStore(
    noopSubscribe,
    () => /iphone|ipad|ipod/i.test(navigator.userAgent),
    () => false,
  )
  // En el servidor se asume "instalada" para no mostrar el aviso antes de hidratar.
  const isStandalone = useSyncExternalStore(
    noopSubscribe,
    () => window.matchMedia('(display-mode: standalone)').matches,
    () => true,
  )
  const storedDismissed = useSyncExternalStore(noopSubscribe, readSessionDismissed, () => true)

  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (isIOS) return
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isIOS])

  function dismiss() {
    try {
      sessionStorage.setItem('pwa-dismissed', '1')
    } catch {
      // sin almacenamiento disponible: sólo se oculta en esta vista
    }
    setHidden(true)
  }

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setHidden(true)
  }

  const visible = !hidden && !isStandalone && !storedDismissed && (isIOS || prompt !== null)
  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Instalar la aplicación"
      className="fixed bottom-24 left-4 right-4 z-50 max-w-sm mx-auto"
    >
      <div className="bg-calm-800 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        <div className="text-3xl shrink-0" aria-hidden="true">🚗</div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm">Instalá VehiLink</p>
          {isIOS ? (
            <p className="text-calm-200 text-xs mt-0.5">
              Tocá <strong>Compartir</strong> → <strong>Agregar a pantalla de inicio</strong>
            </p>
          ) : (
            <p className="text-calm-200 text-xs mt-0.5">
              Accedé sin abrir el navegador. Funciona sin conexión.
            </p>
          )}
          {!isIOS && (
            <button
              type="button"
              onClick={install}
              className="mt-2 flex items-center gap-1.5 bg-calm-500 hover:bg-calm-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
            >
              <Download size={12} aria-hidden="true" /> Instalar
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso de instalación"
          className="text-calm-200 hover:text-white shrink-0 p-1 -m-1 rounded-lg"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
