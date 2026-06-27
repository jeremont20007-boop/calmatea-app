'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function CheckoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button size="xl" onClick={handleCheckout} disabled={loading} className="w-full">
      {loading ? 'Redirigiendo...' : '⭐ Activar Premium — 4,99€/mes'}
    </Button>
  )
}
