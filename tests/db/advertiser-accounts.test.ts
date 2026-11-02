// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readMigration } from './helpers'

/**
 * Prueba la migración real de cuentas de anunciantes en un Postgres en memoria:
 * qué crea el trigger al registrarse cada tipo de cuenta, y qué borra la limpieza.
 */
const MIGRATION = '20261102_advertiser_accounts.sql'

// Imitación mínima de Supabase: auth.users con el trigger, y las tablas que importan
const BASE_SCHEMA = `
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);

  create table profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    full_name text not null default '',
    role text not null default 'conductor' check (role in ('conductor', 'propietario', 'admin')),
    plan text not null default 'free',
    city text,
    phone text
  );
  create table advertisers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    company_name text not null,
    contact_email text not null,
    phone text,
    website text,
    status text not null default 'pending'
  );
  create table vehicles (id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id) on delete cascade);
  create table applications (id uuid primary key default gen_random_uuid(), driver_id uuid not null references profiles(id) on delete cascade);
  create table driver_documents (id uuid primary key default gen_random_uuid(), driver_id uuid not null references profiles(id) on delete cascade);
  create table support_tickets (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade);
  create table ratings (
    id uuid primary key default gen_random_uuid(),
    from_user_id uuid not null references profiles(id) on delete cascade,
    to_user_id uuid not null references profiles(id) on delete cascade
  );

  -- Versión vieja del trigger (la de schema.sql): perfil de conductor para todos
  create function handle_new_user() returns trigger language plpgsql security definer as $$
  begin
    insert into profiles (user_id, full_name, role) values (
      new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'role', 'conductor')
    );
    return new;
  end $$;
  create trigger on_auth_user_created after insert on auth.users
    for each row execute procedure handle_new_user();
`

let db: PGlite

async function signUp(email: string, meta: Record<string, unknown> = {}) {
  const { rows } = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
    [email, JSON.stringify(meta)]
  )
  return rows[0].id
}

async function profileOf(userId: string) {
  const { rows } = await db.query<Record<string, unknown>>(`select * from profiles where user_id = $1`, [userId])
  return rows[0] ?? null
}

async function advertiserOf(userId: string) {
  const { rows } = await db.query<Record<string, unknown>>(`select * from advertisers where user_id = $1`, [userId])
  return rows[0] ?? null
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(BASE_SCHEMA)
}, 30_000)

describe('Limpieza de perfiles creados de más (datos de antes de la actualización)', () => {
  let ids: Record<string, string>

  beforeAll(async () => {
    // Con el trigger VIEJO: todos reciben perfil de conductor
    ids = {
      anuncianteLimpio: await signUp('limpio@example.test'),
      anuncianteConTicket: await signUp('ticket@example.test'),
      anunciantePremium: await signUp('premium@example.test'),
      conductorReal: await signUp('conductor@example.test', { full_name: 'Juana', role: 'conductor' }),
    }
    for (const key of ['anuncianteLimpio', 'anuncianteConTicket', 'anunciantePremium']) {
      await db.query(`insert into advertisers (user_id, company_name, contact_email) values ($1, $2, $3)`, [
        ids[key],
        key,
        `${key}@example.test`,
      ])
    }
    const conTicket = await profileOf(ids.anuncianteConTicket)
    await db.query(`insert into support_tickets (user_id) values ($1)`, [conTicket.id])
    await db.query(`update profiles set plan = 'premium' where user_id = $1`, [ids.anunciantePremium])

    // Correr la migración (dos veces: tiene que ser idempotente)
    await db.exec(readMigration(MIGRATION))
    await db.exec(readMigration(MIGRATION))
  })

  it('borra el perfil de conductor de un anunciante que no tiene nada asociado', async () => {
    expect(await profileOf(ids.anuncianteLimpio)).toBeNull()
    expect(await advertiserOf(ids.anuncianteLimpio)).not.toBeNull()
  })

  it('NO borra perfiles con actividad (por ejemplo, un ticket de soporte)', async () => {
    expect(await profileOf(ids.anuncianteConTicket)).not.toBeNull()
  })

  it('NO borra perfiles premium', async () => {
    expect(await profileOf(ids.anunciantePremium)).not.toBeNull()
  })

  it('NO toca a los conductores que no son anunciantes', async () => {
    expect(await profileOf(ids.conductorReal)).toMatchObject({ full_name: 'Juana', role: 'conductor' })
  })
})

describe('Registro con la actualización aplicada', () => {
  beforeEach(async () => {
    await db.exec(readMigration(MIGRATION))
  })

  it('un anunciante recibe su fila en advertisers (en revisión) y NO un perfil de conductor', async () => {
    const id = await signUp('remis@example.test', {
      account_type: 'advertiser',
      company_name: '  Remis Neuquén SRL  ',
      phone: '+54 299 000 0000',
      website: 'https://remis.example.test',
    })
    expect(await profileOf(id)).toBeNull()
    expect(await advertiserOf(id)).toMatchObject({
      company_name: 'Remis Neuquén SRL',
      contact_email: 'remis@example.test',
      phone: '+54 299 000 0000',
      website: 'https://remis.example.test',
      status: 'pending',
    })
  })

  it('un anunciante no puede registrarse ya aprobado', async () => {
    const id = await signUp('apurado@example.test', { account_type: 'advertiser', company_name: 'X', status: 'active' })
    expect((await advertiserOf(id))?.status).toBe('pending')
  })

  it('descarta un sitio web que no sea http/https', async () => {
    const id = await signUp('raro@example.test', { account_type: 'advertiser', company_name: 'X', website: 'javascript:alert(1)' })
    expect((await advertiserOf(id))?.website).toBeNull()
  })

  it('si no manda nombre de empresa, usa la primera parte del email', async () => {
    const id = await signUp('sinnombre@example.test', { account_type: 'advertiser' })
    expect((await advertiserOf(id))?.company_name).toBe('sinnombre')
  })

  it('un conductor o propietario sigue recibiendo su perfil como siempre', async () => {
    const c = await signUp('nuevo-conductor@example.test', { full_name: 'Ana', role: 'conductor', city: 'Neuquén' })
    const p = await signUp('nuevo-propietario@example.test', { full_name: 'Pedro', role: 'propietario' })
    expect(await profileOf(c)).toMatchObject({ full_name: 'Ana', role: 'conductor', city: 'Neuquén' })
    expect(await profileOf(p)).toMatchObject({ role: 'propietario' })
    expect(await advertiserOf(c)).toBeNull()
  })

  it('nadie puede registrarse como admin', async () => {
    const id = await signUp('vivo@example.test', { full_name: 'Vivo', role: 'admin' })
    expect((await profileOf(id))?.role).toBe('conductor')
  })

  it('schema.sql incluye la migración (para instalaciones nuevas)', () => {
    const schema = readFileSync(join(__dirname, '../../supabase/schema.sql'), 'utf8')
    expect(schema).toContain(readMigration(MIGRATION).trim())
  })
})
