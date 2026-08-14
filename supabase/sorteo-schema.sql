-- ═══════════════════════════════════════════════════════════════════════════
-- Campaña "4 chorizos de regalo + sorteo de órdenes de compra"
-- Ejecutar en el SQL editor de Supabase, después de schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─── PARTICIPANTES ─────────────────────────────────────────────────────────

create table if not exists sorteo_participantes (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  -- Normalizado a solo dígitos con código de área, sin 0 ni 15 (ej: 2994123456)
  telefono text not null,
  barrio text,
  -- 'con_compra' entrega el regalo; 'sin_compra' es la vía sin obligación de
  -- compra que exige la normativa de concursos publicitarios.
  modalidad text not null default 'con_compra'
    check (modalidad in ('con_compra', 'sin_compra')),
  -- Número del ticket de compra. Cada ticket habilita una sola participación.
  ticket_numero text,
  monto_compra numeric(12, 2),
  chances integer not null default 1 check (chances between 1 and 10),
  regalo_entregado boolean not null default false,
  origen text,
  acepta_bases boolean not null default false,
  -- Consentimiento explícito para recibir promociones. Sin esto no se le
  -- puede escribir por WhatsApp más allá del sorteo.
  acepta_novedades boolean not null default false,
  created_at timestamptz not null default now()
);

-- Un ticket de compra sólo puede usarse una vez. Los participantes sin compra
-- no tienen ticket, así que el índice parcial no los alcanza.
create unique index if not exists sorteo_participantes_ticket_unico
  on sorteo_participantes (ticket_numero)
  where ticket_numero is not null;

-- Una sola participación sin compra por teléfono.
create unique index if not exists sorteo_participantes_sin_compra_unico
  on sorteo_participantes (telefono)
  where modalidad = 'sin_compra';

create index if not exists sorteo_participantes_created_idx
  on sorteo_participantes (created_at desc);
create index if not exists sorteo_participantes_telefono_idx
  on sorteo_participantes (telefono);

-- ─── GANADORES ─────────────────────────────────────────────────────────────

create table if not exists sorteo_ganadores (
  id uuid primary key default uuid_generate_v4(),
  participante_id uuid references sorteo_participantes(id) on delete restrict not null,
  puesto integer not null check (puesto between 1 and 3),
  premio_monto integer not null,
  -- Semilla del sorteo: permite reconstruir y auditar el resultado.
  seed text not null,
  total_chances integer not null,
  sorteado_at timestamptz not null default now(),
  entregado boolean not null default false,
  entregado_at timestamptz
);

-- Un solo ganador por puesto, y nadie gana dos veces.
create unique index if not exists sorteo_ganadores_puesto_unico
  on sorteo_ganadores (puesto);
create unique index if not exists sorteo_ganadores_participante_unico
  on sorteo_ganadores (participante_id);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────
-- El formulario público escribe con la service role key desde el route
-- handler, así que acá no se habilita ningún acceso anónimo: los datos
-- personales de los vecinos no quedan expuestos al cliente.

alter table sorteo_participantes enable row level security;
alter table sorteo_ganadores enable row level security;

create policy "Admins ven participantes" on sorteo_participantes
  for select using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins actualizan participantes" on sorteo_participantes
  for update using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins ven ganadores" on sorteo_ganadores
  for select using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins actualizan ganadores" on sorteo_ganadores
  for update using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

-- ─── MÉTRICAS ──────────────────────────────────────────────────────────────
-- Vista de apoyo para el panel: rendimiento por canal de difusión.

create or replace view sorteo_metricas_origen as
  select
    coalesce(origen, 'sin_dato') as origen,
    count(*) as participaciones,
    count(*) filter (where modalidad = 'con_compra') as con_compra,
    coalesce(sum(monto_compra) filter (where modalidad = 'con_compra'), 0) as facturacion,
    coalesce(avg(monto_compra) filter (where modalidad = 'con_compra'), 0) as ticket_promedio
  from sorteo_participantes
  group by 1
  order by participaciones desc;
