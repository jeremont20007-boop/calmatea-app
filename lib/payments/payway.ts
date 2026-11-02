import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * PayWay no nos da una forma documentada de verificar sus avisos, así que
 * firmamos nosotros la URL de aviso (notification_url) al crear el pago:
 *   /api/payway/webhook?profile=<id>&sig=<HMAC(PAYWAY_WEBHOOK_SECRET, id)>
 * Sólo nuestro servidor y PayWay conocen esa URL, y la firma no se puede
 * inventar sin el secreto. Así nadie puede "regalarse" el plan premium
 * mandando un aviso falso.
 */
function getSecret(): string | null {
  const secret = process.env.PAYWAY_WEBHOOK_SECRET
  return secret && secret.length >= 16 ? secret : null
}

export function isPaywayWebhookConfigured(): boolean {
  return getSecret() !== null
}

export function signPaywayProfile(profileId: string): string {
  const secret = getSecret()
  if (!secret) throw new Error('PAYWAY_WEBHOOK_SECRET no está configurado (mínimo 16 caracteres)')
  return createHmac('sha256', secret).update(profileId).digest('hex')
}

export function verifyPaywaySignature(profileId: string, signature: string): boolean {
  if (!getSecret()) return false
  const expected = Buffer.from(signPaywayProfile(profileId), 'hex')
  const received = Buffer.from(signature, 'hex')
  return expected.length === received.length && timingSafeEqual(expected, received)
}

/**
 * Formato anterior de la URL de aviso (?token=<secreto>), usado por pagos
 * iniciados antes de este cambio. Sigue exigiendo el secreto, pero no ata el
 * aviso a un perfil: se acepta sólo para no dejar sin premium a quien ya pagó.
 */
export function verifyLegacyPaywayToken(token: string): boolean {
  const secret = getSecret()
  if (!secret) return false
  const expected = Buffer.from(secret)
  const received = Buffer.from(token)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export function buildPaywayNotificationUrl(appUrl: string, profileId: string): string {
  const url = new URL('/api/payway/webhook', appUrl)
  url.searchParams.set('profile', profileId)
  url.searchParams.set('sig', signPaywayProfile(profileId))
  return url.toString()
}
