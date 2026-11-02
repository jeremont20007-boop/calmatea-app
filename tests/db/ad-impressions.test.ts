// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { ADVERTISER_ID, actAs, createTestDb, resetData } from './helpers'

/** Prueba la función real serve_random_ad() en un Postgres en memoria. */
let db: PGlite

beforeAll(async () => {
  db = await createTestDb()
}, 30_000)

beforeEach(async () => {
  await resetData(db)
})

async function insertAd(id: string, values: Record<string, string> = {}) {
  const cols = { status: `'active'`, ...values }
  await db.query(
    `insert into ads (id, advertiser_id, title, ${Object.keys(cols).join(', ')})
     values ('${id}', '${ADVERTISER_ID}', 'Anuncio ${id.slice(0, 4)}', ${Object.values(cols).join(', ')})`
  )
}

async function impressions(id: string) {
  const { rows } = await db.query<{ n: number }>(`select current_impressions as n from ads where id = $1`, [id])
  return rows[0].n
}

async function serve() {
  await actAs(db, 'server')
  const { rows } = await db.query<Record<string, unknown>>(`select * from public.serve_random_ad()`)
  await actAs(db, 'sql-editor')
  return rows
}

const A = 'a0000000-0000-4000-8000-000000000001'
const B = 'b0000000-0000-4000-8000-000000000002'

describe('serve_random_ad (contador de impresiones)', () => {
  it('devuelve un anuncio activo con el nombre del anunciante y suma 1 impresión', async () => {
    await insertAd(A)
    const rows = await serve()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: A, advertiser_name: 'Remises de Prueba SRL', cta_text: 'Ver más' })
    expect(await impressions(A)).toBe(1)
  })

  it('cada vez que se muestra suma una impresión', async () => {
    await insertAd(A)
    for (let i = 0; i < 5; i++) await serve()
    expect(await impressions(A)).toBe(5)
  })

  it('no muestra anuncios que no están activos', async () => {
    await insertAd(A, { status: `'pending_review'` })
    await insertAd(B, { status: `'paused'` })
    expect(await serve()).toHaveLength(0)
    expect(await impressions(A)).toBe(0)
  })

  it('no muestra anuncios vencidos ni que todavía no empezaron', async () => {
    await insertAd(A, { ends_at: `now() - interval '1 day'` })
    await insertAd(B, { starts_at: `now() + interval '1 day'` })
    expect(await serve()).toHaveLength(0)
  })

  it('deja de mostrarlo al llegar al máximo de impresiones', async () => {
    await insertAd(A, { max_impressions: '2' })
    expect(await serve()).toHaveLength(1)
    expect(await serve()).toHaveLength(1)
    expect(await serve()).toHaveLength(0)
    expect(await impressions(A)).toBe(2)
  })

  it('reparte entre varios anuncios activos', async () => {
    await insertAd(A)
    await insertAd(B)
    for (let i = 0; i < 40; i++) await serve()
    const a = await impressions(A)
    const b = await impressions(B)
    expect(a + b).toBe(40)
    expect(a).toBeGreaterThan(0)
    expect(b).toBeGreaterThan(0)
  })

  it('el navegador (anon / usuario logueado) no puede llamarla para inflar el contador', async () => {
    const { rows } = await db.query<{ anon: boolean; auth: boolean; srv: boolean }>(`
      select has_function_privilege('anon', 'public.serve_random_ad()', 'execute') as anon,
             has_function_privilege('authenticated', 'public.serve_random_ad()', 'execute') as auth,
             has_function_privilege('service_role', 'public.serve_random_ad()', 'execute') as srv
    `)
    expect(rows[0]).toEqual({ anon: false, auth: false, srv: true })
  })

  it('un anunciante tampoco puede cambiar el contador a mano', async () => {
    await insertAd(A)
    await actAs(db, 'advertiser')
    await db.query(`update ads set current_impressions = 999999 where id = $1`, [A])
    expect(await impressions(A)).toBe(0)
  })
})
