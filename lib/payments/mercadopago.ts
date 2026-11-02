export interface MercadoPagoPayment {
  id: number | string
  status: string
  transaction_amount: number
  currency_id: string
  metadata?: Record<string, unknown>
}

/**
 * Obtiene un pago directamente de la API de MercadoPago.
 * Así no confiamos en lo que trae el aviso (que cualquiera podría falsificar):
 * sólo usamos el ID y le preguntamos a MercadoPago el estado real.
 */
export async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment | null> {
  if (!/^\d+$/.test(paymentId)) return null
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return (await res.json()) as MercadoPagoPayment
}

/**
 * Extrae el ID de pago de un aviso de MercadoPago. Soporta los dos formatos:
 *  - Webhooks: body JSON { type: 'payment', data: { id } }
 *  - IPN (viejo): query string ?topic=payment&id=123
 * Devuelve null si el aviso no es de un pago (por ejemplo, merchant_order).
 */
export function getPaymentIdFromNotification(url: URL, body: Record<string, unknown> | null): string | null {
  const type = (body?.type ?? body?.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic')) as
    | string
    | null
  if (type && type !== 'payment') return null

  const data = body?.data as { id?: unknown } | undefined
  const id = data?.id ?? url.searchParams.get('data.id') ?? (type ? body?.id ?? url.searchParams.get('id') : null)
  return id === null || id === undefined ? null : String(id)
}
