'use client'

import { useState } from 'react'

interface CheckoutButtonProps {
  role: string
}

export function CheckoutButton({ role }: CheckoutButtonProps) {
  const [loading, setLoading] = useState<'mp' | 'pw' | null>(null)

  async function pay(gateway: 'mp' | 'pw') {
    setLoading(gateway)
    const endpoint = gateway === 'mp' ? '/api/mercadopago/checkout' : '/api/payway/checkout'
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setLoading(null)
        alert('Error al conectar con la pasarela de pagos. Intentá de nuevo.')
      }
    } catch {
      setLoading(null)
    }
  }

  const price = role === 'conductor' ? '$2.990' : '$3.990'

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-semibold text-calm-600">
        {price} ARS / mes — elegí tu forma de pago:
      </p>

      {/* MercadoPago */}
      <button
        onClick={() => pay('mp')}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-extrabold text-sm transition-all disabled:opacity-60 bg-[#009EE3] text-white hover:bg-[#0082c0]"
      >
        {loading === 'mp' ? (
          <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.6c-.152.672-.547.84-1.107.522l-3.06-2.255-1.476 1.42c-.163.163-.3.3-.616.3l.22-3.107 5.664-5.116c.247-.218-.054-.34-.383-.122L6.18 14.603l-2.98-.932c-.648-.202-.66-.648.135-.96l11.638-4.487c.54-.196 1.013.132.589 2.024z" />
          </svg>
        )}
        {loading === 'mp' ? 'Redirigiendo...' : 'Pagar con Mercado Pago'}
      </button>

      {/* PayWay */}
      <button
        onClick={() => pay('pw')}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-extrabold text-sm transition-all disabled:opacity-60 bg-[#E8001D] text-white hover:bg-[#c0001a]"
      >
        {loading === 'pw' ? (
          <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          </svg>
        )}
        {loading === 'pw' ? 'Redirigiendo...' : 'Pagar con PayWay'}
      </button>

      <p className="text-center text-xs text-calm-400">Pago seguro y encriptado</p>
    </div>
  )
}
