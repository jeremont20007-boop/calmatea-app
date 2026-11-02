'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // Register after the page has finished loading so the service worker
    // doesn't compete with the first render for bandwidth/CPU on phones.
    const register = () => navigator.serviceWorker.register('/sw.js').catch(console.error)
    if (document.readyState === 'complete') {
      register()
      return
    }
    window.addEventListener('load', register, { once: true })
    return () => window.removeEventListener('load', register)
  }, [])
  return null
}
