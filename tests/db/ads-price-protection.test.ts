// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { AD_DURATION_OPTIONS, CREATIVE_TIERS, calcAdPrice } from '@/types'
import { getAdPriceARS } from '@/lib/payments/ads'
import {
  ADMIN_USER, ADVERTISER_ID, AD_ID, MIGRATIONS, actAs, createTestDb, readMigration, resetData, type Who,
} from './helpers'

/**
 * Corre las migraciones reales (supabase/migrations/...) en un Postgres en
 * memoria (PGlite) y simula pedidos de un anunciante, un admin y el servidor.
 */
let db: PGlite
const as = (who: Who) => actAs(db, who)

async function getAd() {
  const { rows } = await db.query<Record<string, unknown>>(`select * from ads where id = $1`, [AD_ID])
  return rows[0]
}

/** El anunciante intenta crear un anuncio "tramposo": precio $1, ya pago, activo y por un año. */
async function createAdAsAdvertiser() {
  await as('advertiser')
  await db.query(
    `insert into ads (id, advertiser_id, title, duration_days, total_price, status, payment_status, ends_at)
     values ($1, $2, 'Mi anuncio', 30, 1, 'active', 'paid', now() + interval '1 year')`,
    [AD_ID, ADVERTISER_ID]
  )
}

beforeAll(async () => {
  db = await createTestDb()
}, 30_000)

beforeEach(() => resetData(db))

describe('Los precios de la base coinciden con los de la app', () => {
  it.each(AD_DURATION_OPTIONS.map(o => o.days))('anuncio de %i días', async days => {
    const { rows } = await db.query<{ p: string }>(`select public.ad_price_for($1) as p`, [days])
    expect(Number(rows[0].p)).toBe(calcAdPrice(days))
    expect(getAdPriceARS(days)).toBe(calcAdPrice(days))
  })

  it('una duración que no existe no tiene precio', async () => {
    const { rows } = await db.query<{ p: string | null }>(`select public.ad_price_for(365) as p`)
    expect(rows[0].p).toBeNull()
    expect(getAdPriceARS(365)).toBeNull()
    expect(getAdPriceARS(null)).toBeNull()
  })

  it.each(CREATIVE_TIERS.map(t => [t.tier, t.priceARS]))('creatividad nivel %i', async (tier, price) => {
    const { rows } = await db.query<{ p: string }>(`select public.creative_price_for($1) as p`, [tier])
    expect(Number(rows[0].p)).toBe(price)
  })

  it.each(MIGRATIONS)('schema.sql incluye %s (para instalaciones nuevas)', name => {
    const schema = readFileSync(join(__dirname, '../../supabase/schema.sql'), 'utf8')
    expect(schema).toContain(readMigration(name).trim())
  })
})

describe('Anunciante creando un anuncio', () => {
  it('el precio lo pone la base: no puede elegir pagar $1', async () => {
    await createAdAsAdvertiser()
    expect(Number((await getAd()).total_price)).toBe(13500)
  })

  it('no puede crearlo ya pago ni activo, ni con fechas', async () => {
    await createAdAsAdvertiser()
    const ad = await getAd()
    expect(ad.status).toBe('draft')
    expect(ad.payment_status).toBe('pending')
    expect(ad.ends_at).toBeNull()
  })

  it('no puede elegir una duración que no existe', async () => {
    await as('advertiser')
    await expect(
      db.query(`insert into ads (advertiser_id, title, duration_days) values ($1, 'x', 365)`, [ADVERTISER_ID])
    ).rejects.toThrow(/Duración de anuncio no permitida/)
  })
})

describe('Anunciante editando su anuncio', () => {
  beforeEach(createAdAsAdvertiser)

  it('puede cambiar el contenido', async () => {
    await db.query(`update ads set title = 'Nuevo título', target_url = 'https://otro.test' where id = $1`, [AD_ID])
    const ad = await getAd()
    expect(ad.title).toBe('Nuevo título')
    expect(ad.target_url).toBe('https://otro.test')
  })

  it('NO puede marcarlo como pago ni activarlo', async () => {
    await db.query(
      `update ads set payment_status = 'paid', status = 'active', ends_at = now() + interval '1 year' where id = $1`,
      [AD_ID]
    )
    const ad = await getAd()
    expect(ad.payment_status).toBe('pending')
    expect(ad.status).toBe('draft')
    expect(ad.ends_at).toBeNull()
  })

  it('NO puede bajarle el precio', async () => {
    await db.query(`update ads set total_price = 1 where id = $1`, [AD_ID])
    expect(Number((await getAd()).total_price)).toBe(13500)
  })

  it('si cambia la duración antes de pagar, el precio se recalcula', async () => {
    await db.query(`update ads set duration_days = 7, total_price = 1 where id = $1`, [AD_ID])
    const ad = await getAd()
    expect(ad.duration_days).toBe(7)
    expect(Number(ad.total_price)).toBe(3500)
  })

  it('NO puede alargar la duración de un anuncio ya pagado', async () => {
    await as('server')
    await db.query(`update ads set payment_status = 'paid' where id = $1`, [AD_ID])
    await as('advertiser')
    await expect(db.query(`update ads set duration_days = 90 where id = $1`, [AD_ID])).rejects.toThrow(/ya pagado/)
  })

  it('NO puede pasar el anuncio a otro anunciante', async () => {
    const other = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    await as('sql-editor')
    await db.query(`insert into advertisers values ($1, $2, 'Otra')`, [other, ADMIN_USER])
    await as('advertiser')
    await db.query(`update ads set advertiser_id = $2 where id = $1`, [AD_ID, other])
    expect((await getAd()).advertiser_id).toBe(ADVERTISER_ID)
  })
})

describe('Servidor (webhook de pagos) y admin', () => {
  beforeEach(createAdAsAdvertiser)

  it('el webhook puede marcarlo como pago', async () => {
    await as('server')
    await db.query(`update ads set payment_status = 'paid', status = 'pending_review' where id = $1`, [AD_ID])
    const ad = await getAd()
    expect(ad.payment_status).toBe('paid')
    expect(ad.status).toBe('pending_review')
  })

  it('el admin puede aprobarlo', async () => {
    await as('admin')
    await db.query(`update ads set status = 'active' where id = $1`, [AD_ID])
    expect((await getAd()).status).toBe('active')
  })
})

describe('Solicitudes de creatividad', () => {
  beforeEach(createAdAsAdvertiser)

  async function getRequest() {
    const { rows } = await db.query<Record<string, unknown>>(`select * from creative_requests`)
    return rows[0]
  }

  async function insertRequest(tier: number, price: number, status = 'pending') {
    await db.query(
      `insert into creative_requests (ad_id, advertiser_id, tier, price_ars, status) values ($1, $2, $3, $4, $5)`,
      [AD_ID, ADVERTISER_ID, tier, price, status]
    )
  }

  it('el precio lo pone la base según el nivel', async () => {
    await insertRequest(7, 1, 'delivered')
    const req = await getRequest()
    expect(Number(req.price_ars)).toBe(110000)
    expect(req.status).toBe('pending')
  })

  it('al cambiar de nivel se recalcula el precio, y no puede marcarla como entregada', async () => {
    await insertRequest(1, 5000)
    await db.query(`update creative_requests set tier = 3, price_ars = 1, status = 'delivered'`)
    const req = await getRequest()
    expect(Number(req.price_ars)).toBe(22000)
    expect(req.status).toBe('pending')
  })

  it('el admin sí puede cambiar el estado', async () => {
    await insertRequest(1, 5000)
    await as('admin')
    await db.query(`update creative_requests set status = 'delivered'`)
    expect((await getRequest()).status).toBe('delivered')
  })

  it('rechaza un nivel que no existe', async () => {
    await expect(insertRequest(9, 1)).rejects.toThrow(/Nivel de creatividad no permitido/)
  })
})
