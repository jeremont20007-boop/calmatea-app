import { describe, expect, it } from 'vitest'
import { getPremiumPriceARS } from '@/lib/payments/premium'
import { getPaymentIdFromNotification } from '@/lib/payments/mercadopago'

describe('getPremiumPriceARS', () => {
  it('devuelve el precio según el rol', () => {
    expect(getPremiumPriceARS('conductor')).toBe(2990)
    expect(getPremiumPriceARS('propietario')).toBe(3990)
  })
  it('no hay plan premium para otros roles', () => {
    expect(getPremiumPriceARS('admin')).toBeNull()
    expect(getPremiumPriceARS(undefined)).toBeNull()
  })
})

describe('getPaymentIdFromNotification', () => {
  const u = (qs = '') => new URL(`http://x/api/mercadopago/webhook${qs}`)
  it.each([
    [u(), { type: 'payment', data: { id: '1' } }, '1'],
    [u(), { action: 'payment.created', data: { id: 2 } }, '2'],
    [u('?topic=payment&id=3'), null, '3'],
    [u('?type=payment&data.id=4'), null, '4'],
    [u(), { type: 'merchant_order', data: { id: '5' } }, null],
    [u('?topic=merchant_order&id=6'), null, null],
    [u(), {}, null],
    [u(), null, null],
  ])('%s %j → %s', (url, body, expected) => {
    expect(getPaymentIdFromNotification(url, body as Record<string, unknown> | null)).toBe(expected)
  })
})
