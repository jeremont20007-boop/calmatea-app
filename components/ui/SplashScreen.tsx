'use client'

import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1800)
    const t2 = setTimeout(() => setVisible(false), 2300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-calm-400 to-calm-600 transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="text-center space-y-4">
        <div className="text-8xl animate-breathe">🚗</div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">VehiLink</h1>
        <p className="text-calm-100 font-semibold text-lg">Intermediación vehicular</p>
      </div>

      <div className="absolute bottom-16 w-40 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full"
          style={{ animation: 'loading 1.8s ease-out forwards' }}
        />
      </div>
    </div>
  )
}
