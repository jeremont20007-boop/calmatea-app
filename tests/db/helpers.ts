import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

/**
 * Postgres en memoria (PGlite) con tablas mínimas que imitan a Supabase,
 * más las migraciones reales de supabase/migrations/.
 */
export const MIGRATIONS = ['20261102_protect_ad_prices.sql', '20261102_ad_impressions.sql']

export function readMigration(name: string) {
  return readFileSync(join(__dirname, '../../supabase/migrations', name), 'utf8')
}

export const ADVERTISER_USER = '11111111-1111-4111-8111-111111111111'
export const ADMIN_USER = '22222222-2222-4222-8222-222222222222'
export const ADVERTISER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
export const AD_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

const BASE_SCHEMA = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin;
  create schema auth;
  create function auth.uid() returns uuid language sql stable as $$
    select (nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub')::uuid
  $$;
  create table profiles (user_id uuid primary key, role text not null);
  create table advertisers (id uuid primary key, user_id uuid not null, company_name text);
  create table ads (
    id uuid primary key default gen_random_uuid(),
    advertiser_id uuid not null references advertisers(id),
    title text not null,
    description text,
    mobile_image_url text,
    desktop_image_url text,
    target_url text not null default 'https://example.test',
    cta_text text not null default 'Ver más',
    status text not null default 'draft',
    starts_at timestamptz,
    ends_at timestamptz,
    max_impressions integer,
    current_impressions integer not null default 0,
    duration_days integer,
    total_price numeric(10,2),
    payment_status text not null default 'pending'
  );
  create table creative_requests (
    id uuid primary key default gen_random_uuid(),
    ad_id uuid not null references ads(id),
    advertiser_id uuid not null references advertisers(id),
    tier integer not null,
    status text not null default 'pending',
    price_ars numeric(10,2) not null
  );
`

export async function createTestDb() {
  const db = new PGlite()
  await db.exec(BASE_SCHEMA)
  // Cada migración se corre dos veces: tienen que ser idempotentes
  for (const name of [...MIGRATIONS, ...MIGRATIONS]) await db.exec(readMigration(name))
  return db
}

export type Who = 'advertiser' | 'admin' | 'server' | 'sql-editor'
const CLAIMS: Record<Who, object | null> = {
  advertiser: { role: 'authenticated', sub: ADVERTISER_USER },
  admin: { role: 'authenticated', sub: ADMIN_USER },
  server: { role: 'service_role' },
  'sql-editor': null,
}

/** Simula quién hace el pedido (como lo haría Supabase con el JWT). */
export async function actAs(db: PGlite, who: Who) {
  const claims = CLAIMS[who]
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims ? JSON.stringify(claims) : ''])
}

export async function resetData(db: PGlite) {
  await actAs(db, 'sql-editor')
  await db.exec(`
    delete from creative_requests; delete from ads; delete from advertisers; delete from profiles;
    insert into profiles values ('${ADVERTISER_USER}', 'conductor'), ('${ADMIN_USER}', 'admin');
    insert into advertisers values ('${ADVERTISER_ID}', '${ADVERTISER_USER}', 'Remises de Prueba SRL');
  `)
}
