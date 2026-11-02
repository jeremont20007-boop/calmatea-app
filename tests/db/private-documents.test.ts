// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readMigration } from './helpers'

/**
 * Prueba la migración real de documentos privados en un Postgres en memoria,
 * con las reglas RLS activas (como en Supabase), haciéndonos pasar por
 * distintos usuarios.
 */
const MIGRATION = '20261102_private_documents.sql'

const U = {
  conductora: '10000000-0000-4000-8000-000000000001',
  otroConductor: '10000000-0000-4000-8000-000000000002',
  propietario: '10000000-0000-4000-8000-000000000003',
  admin: '10000000-0000-4000-8000-000000000004',
}
const P = {
  conductora: '20000000-0000-4000-8000-000000000001',
  otroConductor: '20000000-0000-4000-8000-000000000002',
  propietario: '20000000-0000-4000-8000-000000000003',
  admin: '20000000-0000-4000-8000-000000000004',
}
const VEHICLE = '30000000-0000-4000-8000-000000000001'

const DNI = `driver/${P.conductora}/dni_frente.jpg`
const DNI_OTRO = `driver/${P.otroConductor}/dni_frente.jpg`
const CEDULA = `vehicle/${VEHICLE}/cedula_verde.pdf`

// Imitación mínima de Supabase: auth, storage y las tablas que importan, con RLS
// parecido al del archivo de propuestas.
const BASE_SCHEMA = `
  create role authenticated nologin;
  create schema auth;
  create function auth.uid() returns uuid language sql stable as $$
    select (nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub')::uuid
  $$;

  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean default false);
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text not null,
    unique (bucket_id, name)
  );
  create function storage.foldername(name text) returns text[] language plpgsql as $$
  declare _parts text[];
  begin
    select string_to_array(name, '/') into _parts;
    return _parts[1:array_length(_parts, 1) - 1];
  end $$;
  alter table storage.objects enable row level security;

  create table profiles (id uuid primary key, user_id uuid not null, role text not null);
  create table vehicles (id uuid primary key, owner_id uuid not null references profiles(id));
  create table applications (vehicle_id uuid, driver_id uuid, status text);
  create table driver_documents (
    id uuid primary key default gen_random_uuid(),
    driver_id uuid not null references profiles(id),
    doc_type text not null,
    file_url text,
    status text not null default 'pendiente'
  );
  create table vehicle_documents (
    id uuid primary key default gen_random_uuid(),
    vehicle_id uuid not null references vehicles(id),
    doc_type text not null,
    file_url text,
    status text not null default 'pendiente'
  );
  alter table driver_documents enable row level security;
  alter table vehicle_documents enable row level security;

  create function my_profile_id() returns uuid language sql stable security definer as $$
    select id from profiles where user_id = auth.uid()
  $$;
  -- El conductor ve los suyos; el dueño de un auto ve los de quien se postuló y fue aceptado
  create policy "driver docs" on driver_documents for select using (
    driver_id = my_profile_id()
    or exists (
      select 1 from applications a join vehicles v on v.id = a.vehicle_id
       where a.driver_id = driver_documents.driver_id and v.owner_id = my_profile_id() and a.status = 'aceptada'
    )
  );
  create policy "vehicle docs" on vehicle_documents for select using (
    exists (select 1 from vehicles v where v.id = vehicle_id and v.owner_id = my_profile_id())
  );

  grant usage on schema storage, auth, public to authenticated;
  grant select, insert, update, delete on all tables in schema storage to authenticated;
  grant select on all tables in schema public to authenticated;
`

let db: PGlite

async function asUser(userId: string | null) {
  await db.exec('reset role')
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [
    userId ? JSON.stringify({ role: 'authenticated', sub: userId }) : '',
  ])
  if (userId) await db.exec('set role authenticated')
}

async function asOwnerOfDb() {
  await asUser(null)
}

async function canSee(path: string) {
  const { rows } = await db.query(`select 1 from storage.objects where bucket_id = 'documents' and name = $1`, [path])
  return rows.length === 1
}

async function upload(path: string) {
  await db.query(`insert into storage.objects (bucket_id, name) values ('documents', $1)`, [path])
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(BASE_SCHEMA)
  // Un bucket público viejo con una regla que dejaba ver todo (como si se hubiera creado a mano)
  await db.exec(`
    insert into storage.buckets values ('documents', 'documents', true), ('ads-media', 'ads-media', true);
    create policy "Public read documents" on storage.objects for select using (bucket_id = 'documents');
    create policy "Public read ads" on storage.objects for select using (bucket_id = 'ads-media');
  `)
}, 30_000)

beforeEach(async () => {
  await asOwnerOfDb()
  await db.exec(`
    delete from storage.objects; delete from driver_documents; delete from vehicle_documents;
    delete from applications; delete from vehicles; delete from profiles;
    insert into profiles values
      ('${P.conductora}', '${U.conductora}', 'conductor'),
      ('${P.otroConductor}', '${U.otroConductor}', 'conductor'),
      ('${P.propietario}', '${U.propietario}', 'propietario'),
      ('${P.admin}', '${U.admin}', 'admin');
    insert into vehicles values ('${VEHICLE}', '${P.propietario}');
    insert into storage.objects (bucket_id, name) values
      ('documents', '${DNI}'), ('documents', '${DNI_OTRO}'), ('documents', '${CEDULA}'),
      ('ads-media', 'publicidad/banner.png');
    insert into driver_documents (driver_id, doc_type, file_url) values
      ('${P.conductora}', 'dni_frente', '${DNI}'),
      ('${P.otroConductor}', 'dni_frente', '${DNI_OTRO}');
    insert into vehicle_documents (vehicle_id, doc_type, file_url) values ('${VEHICLE}', 'cedula_verde', '${CEDULA}');
  `)
})

describe('Migración de documentos privados', () => {
  beforeAll(async () => {
    await asOwnerOfDb()
    await db.exec(readMigration(MIGRATION))
    await db.exec(readMigration(MIGRATION)) // idempotente
  })

  it('deja el bucket privado', async () => {
    await asOwnerOfDb()
    const { rows } = await db.query<{ public: boolean }>(`select public from storage.buckets where id = 'documents'`)
    expect(rows[0].public).toBe(false)
  })

  it('borra la regla vieja que dejaba ver todo, y no toca la de anuncios', async () => {
    await asOwnerOfDb()
    const { rows } = await db.query<{ policyname: string }>(
      `select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' order by 1`
    )
    const names = rows.map(r => r.policyname)
    expect(names).not.toContain('Public read documents')
    expect(names).toContain('Public read ads')
    expect(names).toEqual(expect.arrayContaining(['Documentos: ver', 'Documentos: subir', 'Documentos: reemplazar', 'Documentos: borrar']))
  })

  it('schema.sql incluye la migración (para instalaciones nuevas)', () => {
    const schema = readFileSync(join(__dirname, '../../supabase/schema.sql'), 'utf8')
    expect(schema).toContain(readMigration(MIGRATION).trim())
  })

  describe('conversión de registros viejos', () => {
    let converted: Record<string, string | null>
    beforeAll(async () => {
      // Registros con el formato viejo; correr la migración de nuevo los convierte
      await asOwnerOfDb()
      await db.exec(`
        delete from driver_documents;
        insert into profiles values ('${P.conductora}', '${U.conductora}', 'conductor') on conflict do nothing;
        insert into driver_documents (driver_id, doc_type, file_url) values
          ('${P.conductora}', 'licencia_conducir', 'https://abc.supabase.co/storage/v1/object/public/documents/driver/${P.conductora}/licencia_conducir.pdf'),
          ('${P.conductora}', 'dni_dorso', 'pending:driver/${P.conductora}/dni_dorso'),
          ('${P.conductora}', 'dni_frente', '${DNI}');
      `)
      await db.exec(readMigration(MIGRATION))
      const { rows } = await db.query<{ doc_type: string; file_url: string | null }>(
        `select doc_type, file_url from driver_documents`
      )
      converted = Object.fromEntries(rows.map(r => [r.doc_type, r.file_url]))
    })

    it('el link público pasa a ser la ubicación del archivo', () => {
      expect(converted.licencia_conducir).toBe(`driver/${P.conductora}/licencia_conducir.pdf`)
    })

    it('lo que nunca se subió ("pending:") queda vacío para volver a subirlo', () => {
      expect(converted.dni_dorso).toBeNull()
    })

    it('lo que ya estaba en el formato nuevo no cambia', () => {
      expect(converted.dni_frente).toBe(DNI)
    })
  })
})

describe('Quién puede ver los archivos', () => {
  it('la conductora ve su DNI pero NO el de otro conductor', async () => {
    await asUser(U.conductora)
    expect(await canSee(DNI)).toBe(true)
    expect(await canSee(DNI_OTRO)).toBe(false)
  })

  it('un conductor no ve los papeles del auto de otro', async () => {
    await asUser(U.conductora)
    expect(await canSee(CEDULA)).toBe(false)
  })

  it('el propietario ve los papeles de su auto', async () => {
    await asUser(U.propietario)
    expect(await canSee(CEDULA)).toBe(true)
  })

  it('el propietario NO ve el DNI de un conductor que no se postuló', async () => {
    await asUser(U.propietario)
    expect(await canSee(DNI)).toBe(false)
  })

  it('el propietario sí ve el DNI de un conductor que aceptó (regla de la tabla)', async () => {
    await asOwnerOfDb()
    await db.exec(`insert into applications values ('${VEHICLE}', '${P.conductora}', 'aceptada')`)
    await asUser(U.propietario)
    expect(await canSee(DNI)).toBe(true)
    expect(await canSee(DNI_OTRO)).toBe(false)
  })

  it('el admin ve todos los documentos', async () => {
    await asUser(U.admin)
    expect(await canSee(DNI)).toBe(true)
    expect(await canSee(DNI_OTRO)).toBe(true)
    expect(await canSee(CEDULA)).toBe(true)
  })
})

describe('Quién puede subir archivos', () => {
  it('la conductora puede subir en su carpeta', async () => {
    await asUser(U.conductora)
    await upload(`driver/${P.conductora}/licencia_conducir.pdf`)
    expect(await canSee(`driver/${P.conductora}/licencia_conducir.pdf`)).toBe(true)
  })

  it('NO puede subir en la carpeta de otro conductor', async () => {
    await asUser(U.conductora)
    await expect(upload(`driver/${P.otroConductor}/dni_frente.png`)).rejects.toThrow(/row-level security/)
  })

  it('NO puede subir fuera de las carpetas permitidas', async () => {
    await asUser(U.conductora)
    await expect(upload(`otra-cosa/${P.conductora}/x.pdf`)).rejects.toThrow(/row-level security/)
    await expect(upload(`driver/${P.conductora}/sub/carpeta.pdf`)).rejects.toThrow(/row-level security/)
  })

  it('el propietario puede subir papeles de su auto, pero no en carpetas de conductores', async () => {
    await asUser(U.propietario)
    await upload(`vehicle/${VEHICLE}/seguro_vehiculo.pdf`)
    await expect(upload(`driver/${P.propietario}/dni_frente.jpg`)).rejects.toThrow(/row-level security/)
  })

  it('NO puede reemplazar ni borrar el archivo de otro', async () => {
    await asUser(U.otroConductor)
    await db.query(`update storage.objects set name = name where name = $1`, [DNI])
    await db.query(`delete from storage.objects where name = $1`, [DNI])
    await asOwnerOfDb()
    expect(await canSee(DNI)).toBe(true)
  })

  it('sin sesión no se ve ni se sube nada', async () => {
    await db.exec('reset role')
    await db.query(`select set_config('request.jwt.claims', '', false)`)
    await db.exec('set role authenticated')
    expect(await canSee(DNI)).toBe(false)
    await expect(upload(`driver/${P.conductora}/x.pdf`)).rejects.toThrow(/row-level security/)
  })
})
