-- NOTA: hay una propuesta de correcciones de seguridad (RLS) en
-- supabase/propuestas/2026-11-02_endurecer_rls.sql — leer antes de usar este archivo.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────────────────────────

create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'conductor' check (role in ('conductor', 'propietario')),
  plan text not null default 'free' check (plan in ('free', 'premium')),
  city text,
  phone text,
  -- Conductor-specific
  license_number text,
  experience_years integer,
  bio text,
  available_days text[] not null default '{}',
  preferred_schedule text check (preferred_schedule in ('completo', 'parcial', 'fines_de_semana')),
  -- Stripe
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── VEHICLES ───────────────────────────────────────────────────────────────

create table if not exists vehicles (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references profiles(id) on delete cascade not null,
  make text not null,
  model text not null,
  year integer not null,
  color text not null default '',
  license_plate text not null,
  platforms text[] not null default '{}',
  city text not null,
  -- Revenue split = % the conductor earns
  revenue_split integer not null default 60 check (revenue_split between 40 and 90),
  schedule text not null default 'completo' check (schedule in ('completo', 'parcial', 'fines_de_semana')),
  description text,
  status text not null default 'disponible' check (status in ('disponible', 'ocupado', 'pausado')),
  -- Vehicle classification
  vehicle_type text not null default 'plataforma' check (vehicle_type in ('remis', 'taxi', 'plataforma')),
  is_in_remis_base boolean not null default false,
  remis_base_name text,
  neuquen_only boolean not null default false,
  -- Owner's rental availability
  available_days text[] not null default '{}',
  available_hours text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── APPLICATIONS ────────────────────────────────────────────────────────────

create table if not exists applications (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  driver_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'aceptada', 'rechazada', 'retirada')),
  -- Driver's presentation
  message text,
  -- Driver's bid: % they offer to pay to the owner
  driver_offered_split integer check (driver_offered_split between 40 and 90),
  -- Driver's schedule offer
  driver_available_days text[] not null default '{}',
  driver_schedule text check (driver_schedule in ('completo', 'parcial', 'fines_de_semana')),
  -- Legal
  accepted_legal_disclaimer boolean not null default false,
  -- Owner's response
  owner_response text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(vehicle_id, driver_id)
);

-- ─── DRIVER DOCUMENTS ────────────────────────────────────────────────────────

create table if not exists driver_documents (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid references profiles(id) on delete cascade not null,
  doc_type text not null check (doc_type in (
    'licencia_conducir', 'dni_frente', 'dni_dorso', 'credencial_remis',
    'antecedentes_nacionales', 'antecedentes_provinciales', 'seguro_excedentes'
  )),
  file_url text,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'rechazado')),
  expires_at date,
  notes text,
  uploaded_at timestamptz default now(),
  unique(driver_id, doc_type)
);

-- ─── VEHICLE DOCUMENTS ───────────────────────────────────────────────────────

create table if not exists vehicle_documents (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  doc_type text not null check (doc_type in (
    'titulo_propiedad', 'cedula_verde', 'seguro_vehiculo',
    'habilitacion_remis', 'habilitacion_taxi'
  )),
  file_url text,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'rechazado')),
  expires_at date,
  notes text,
  uploaded_at timestamptz default now(),
  unique(vehicle_id, doc_type)
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table applications enable row level security;
alter table driver_documents enable row level security;
alter table vehicle_documents enable row level security;

-- Profiles
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = user_id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = user_id);

create policy "Owners can view driver profiles of applicants" on profiles
  for select using (
    role = 'conductor' and exists (
      select 1 from applications a
      join vehicles v on v.id = a.vehicle_id
      where a.driver_id = profiles.id
        and v.owner_id = (select id from profiles where user_id = auth.uid())
    )
  );

-- Vehicles
create policy "Anyone logged in can view available vehicles" on vehicles
  for select using (status = 'disponible');

create policy "Owners can view all their vehicles" on vehicles
  for select using (
    owner_id = (select id from profiles where user_id = auth.uid())
  );

create policy "Owners can insert vehicles" on vehicles
  for insert with check (
    owner_id = (select id from profiles where user_id = auth.uid())
  );

create policy "Owners can update their vehicles" on vehicles
  for update using (
    owner_id = (select id from profiles where user_id = auth.uid())
  );

create policy "Owners can delete their vehicles" on vehicles
  for delete using (
    owner_id = (select id from profiles where user_id = auth.uid())
  );

-- Applications
create policy "Drivers can view own applications" on applications
  for select using (
    driver_id = (select id from profiles where user_id = auth.uid())
  );

create policy "Owners can view applications for their vehicles" on applications
  for select using (
    exists (
      select 1 from vehicles v
      where v.id = applications.vehicle_id
        and v.owner_id = (select id from profiles where user_id = auth.uid())
    )
  );

create policy "Drivers can insert applications" on applications
  for insert with check (
    driver_id = (select id from profiles where user_id = auth.uid())
  );

create policy "Drivers can update own pending applications" on applications
  for update using (
    driver_id = (select id from profiles where user_id = auth.uid())
    and status = 'pendiente'
  );

create policy "Owners can update applications for their vehicles" on applications
  for update using (
    exists (
      select 1 from vehicles v
      where v.id = applications.vehicle_id
        and v.owner_id = (select id from profiles where user_id = auth.uid())
    )
  );

-- Driver documents
create policy "Drivers can manage own documents" on driver_documents
  for all using (
    driver_id = (select id from profiles where user_id = auth.uid())
  );

create policy "Owners can view docs of applicants" on driver_documents
  for select using (
    exists (
      select 1 from applications a
      join vehicles v on v.id = a.vehicle_id
      where a.driver_id = driver_documents.driver_id
        and v.owner_id = (select id from profiles where user_id = auth.uid())
        and a.status = 'aceptada'
    )
  );

-- Vehicle documents
create policy "Owners can manage own vehicle documents" on vehicle_documents
  for all using (
    exists (
      select 1 from vehicles v
      where v.id = vehicle_documents.vehicle_id
        and v.owner_id = (select id from profiles where user_id = auth.uid())
    )
  );

create policy "Accepted drivers can view vehicle docs" on vehicle_documents
  for select using (
    exists (
      select 1 from applications a
      where a.vehicle_id = vehicle_documents.vehicle_id
        and a.driver_id = (select id from profiles where user_id = auth.uid())
        and a.status = 'aceptada'
    )
  );

-- ─── FUNCTIONS & TRIGGERS ────────────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (user_id, full_name, role, city, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'conductor'),
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at();

create trigger vehicles_updated_at before update on vehicles
  for each row execute procedure update_updated_at();

create trigger applications_updated_at before update on applications
  for each row execute procedure update_updated_at();

-- ─── ADMIN ROLE ──────────────────────────────────────────────────────────────
-- Run in Supabase SQL editor to expand the role constraint:
-- alter table profiles drop constraint if exists profiles_role_check;
-- alter table profiles add constraint profiles_role_check
--   check (role in ('conductor', 'propietario', 'admin'));

-- ─── SUPPORT TICKETS ─────────────────────────────────────────────────────────

create table if not exists support_tickets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  subject text not null,
  message text not null,
  category text not null default 'otro'
    check (category in ('falla_tecnica', 'cambio_datos', 'disputa', 'pago', 'otro')),
  status text not null default 'abierto'
    check (status in ('abierto', 'en_revision', 'resuelto', 'cerrado')),
  admin_response text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table support_tickets enable row level security;

create policy "Users can manage own tickets" on support_tickets
  for all using (user_id = (select id from profiles where user_id = auth.uid()));

create policy "Admins can view all tickets" on support_tickets
  for select using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can update any ticket" on support_tickets
  for update using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

create trigger support_tickets_updated_at before update on support_tickets
  for each row execute procedure update_updated_at();

-- ─── RATINGS ─────────────────────────────────────────────────────────────────

create table if not exists ratings (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references profiles(id) on delete cascade not null,
  to_user_id uuid references profiles(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 7),
  comment text,
  vehicle_id uuid references vehicles(id) on delete set null,
  created_at timestamptz default now(),
  constraint no_self_rating check (from_user_id != to_user_id),
  unique(from_user_id, to_user_id, vehicle_id)
);

alter table ratings enable row level security;

create policy "Anyone logged in can view ratings" on ratings
  for select using (auth.uid() is not null);

create policy "Users can insert own ratings" on ratings
  for insert with check (
    from_user_id = (select id from profiles where user_id = auth.uid())
  );

create policy "Users can update own ratings" on ratings
  for update using (
    from_user_id = (select id from profiles where user_id = auth.uid())
  );

-- ─── STORAGE ─────────────────────────────────────────────────────────────────
-- El bucket privado "documents" y sus reglas se crean al final de este archivo
-- (ver "DOCUMENTOS PERSONALES EN UN BUCKET PRIVADO").

-- ─── ADVERTISERS ─────────────────────────────────────────────────────────────

create table if not exists advertisers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  company_name text not null,
  contact_email text not null,
  phone text,
  website text,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz default now()
);

alter table advertisers enable row level security;

create policy "Advertisers can view own record" on advertisers
  for select using (auth.uid() = user_id);

create policy "Advertisers can insert own record" on advertisers
  for insert with check (auth.uid() = user_id);

create policy "Advertisers can update own record" on advertisers
  for update using (auth.uid() = user_id);

create policy "Admins can manage advertisers" on advertisers
  for all using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

-- ─── ADS ─────────────────────────────────────────────────────────────────────

create table if not exists ads (
  id uuid primary key default uuid_generate_v4(),
  advertiser_id uuid references advertisers(id) on delete cascade not null,
  title text not null,
  description text,
  image_url text,
  target_url text not null,
  cta_text text not null default 'Ver más',
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'active', 'paused', 'finished', 'rejected')),
  starts_at timestamptz,
  ends_at timestamptz,
  max_impressions integer,
  current_impressions integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table ads enable row level security;

create policy "Anyone can view active ads" on ads
  for select using (status = 'active');

create policy "Advertisers can view own ads" on ads
  for select using (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
  );

create policy "Advertisers can insert own ads" on ads
  for insert with check (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
  );

create policy "Advertisers can update own ads" on ads
  for update using (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
  );

create policy "Admins can manage ads" on ads
  for all using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

-- ─── ADS — image + pricing columns ──────────────────────────────────────────

alter table ads add column if not exists mobile_image_url text;
alter table ads add column if not exists desktop_image_url text;
alter table ads add column if not exists duration_days integer;
alter table ads add column if not exists total_price numeric(10,2);
alter table ads add column if not exists payment_status text not null default 'pending'
  check (payment_status in ('pending', 'paid', 'free'));

-- ─── STORAGE — ads-media bucket ──────────────────────────────────────────────
-- Create a PUBLIC bucket named "ads-media" in the Supabase Storage dashboard.
-- Then apply these policies via the dashboard or SQL:
--
-- INSERT policy (authenticated advertisers):
--   auth.uid() is not null AND
--   (storage.foldername(name))[1] IN (
--     SELECT id::text FROM advertisers WHERE user_id = auth.uid()
--   )
--
-- SELECT policy (public):
--   true  (everyone can read ad images)

-- ─── CREATIVE REQUESTS ───────────────────────────────────────────────────────

create table if not exists creative_requests (
  id                   uuid default gen_random_uuid() primary key,
  ad_id                uuid not null references ads(id) on delete cascade,
  advertiser_id        uuid not null references advertisers(id) on delete cascade,
  tier                 integer not null check (tier between 1 and 7),
  selected_deliverables text[] not null default '{}',
  notes                text,
  status               text not null default 'pending'
    check (status in ('pending', 'in_progress', 'delivered', 'revision')),
  price_ars            numeric(10,2) not null,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table creative_requests enable row level security;

create policy "Advertisers can manage own creative requests" on creative_requests
  for all using (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
  );

create policy "Admins can manage creative requests" on creative_requests
  for all using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

-- ─── PROTECCIÓN DE PRECIOS Y ESTADOS DE ANUNCIOS ────────────────────────────
-- Antes, la regla "Advertisers can update own ads" dejaba que un anunciante
-- cambiara CUALQUIER campo de su anuncio desde el navegador: el precio, el
-- estado de pago ("paid"), el estado ("active") y las fechas. Es decir, podía
-- publicar sin pagar y sin revisión, o pagar menos.
--
-- Estos triggers hacen que, para un anunciante:
--   * el precio se calcule SIEMPRE en la base según la duración elegida,
--   * un anuncio nuevo arranque siempre como borrador y pendiente de pago,
--   * al editar sólo pueda cambiar el contenido (título, textos, imágenes, link),
--     y sólo mientras el anuncio está en borrador o fue rechazado (igual que la app),
--   * no pueda cambiar la duración de un anuncio ya pagado.
-- El webhook de pagos (service role) y los admins pueden cambiar todo.
--
-- Es seguro correrlo más de una vez. Reemplaza al trigger de anuncios de
-- supabase/propuestas/2026-11-02_endurecer_rls.sql (si ya se había corrido).
-- IMPORTANTE: si cambiás precios, actualizalos también en types/index.ts
-- (AD_PRICE_PER_DAY_ARS, AD_DURATION_OPTIONS, CREATIVE_TIERS). Un test lo verifica.

-- Precio de un anuncio según su duración (null = duración no permitida)
create or replace function public.ad_price_for(days integer)
returns numeric
language sql
immutable
as $$
  select case days
    when 7  then 3500   -- 500/día, sin descuento
    when 14 then 6650   -- 5% de descuento
    when 30 then 13500  -- 10% de descuento
    when 60 then 25500  -- 15% de descuento
    when 90 then 36000  -- 20% de descuento
    else null
  end::numeric
$$;

-- Precio de un servicio de creatividad según el nivel (null = nivel inválido)
create or replace function public.creative_price_for(tier integer)
returns numeric
language sql
immutable
as $$
  select case tier
    when 1 then 5000
    when 2 then 12000
    when 3 then 22000
    when 4 then 35000
    when 5 then 52000
    when 6 then 75000
    when 7 then 110000
    else null
  end::numeric
$$;

-- ¿Quien hace el cambio es el servidor (service role / SQL Editor) o un admin?
create or replace function public.is_privileged_request()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '') in ('', 'service_role')
    or exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
$$;

create or replace function public.protect_ads_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_privileged_request() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if public.ad_price_for(new.duration_days) is null then
      raise exception 'Duración de anuncio no permitida: %', new.duration_days
        using errcode = 'check_violation';
    end if;
    new.total_price         := public.ad_price_for(new.duration_days);
    new.status              := 'draft';
    new.payment_status      := 'pending';
    new.starts_at           := null;
    new.ends_at             := null;
    new.current_impressions := 0;
    new.max_impressions     := null;
    return new;
  end if;

  -- UPDATE hecho por el anunciante
  -- El contenido sólo se edita en borrador o si fue rechazado (igual que la app):
  -- un anuncio aprobado no puede cambiar sin pasar de nuevo por revisión.
  if old.status not in ('draft', 'rejected') then
    raise exception 'Este anuncio ya no se puede editar'
      using errcode = 'check_violation';
  end if;

  if new.duration_days is distinct from old.duration_days then
    if old.payment_status <> 'pending' then
      raise exception 'No se puede cambiar la duración de un anuncio ya pagado'
        using errcode = 'check_violation';
    end if;
    if public.ad_price_for(new.duration_days) is null then
      raise exception 'Duración de anuncio no permitida: %', new.duration_days
        using errcode = 'check_violation';
    end if;
  end if;

  new.advertiser_id       := old.advertiser_id;
  new.status              := old.status;
  new.payment_status      := old.payment_status;
  new.starts_at           := old.starts_at;
  new.ends_at             := old.ends_at;
  new.current_impressions := old.current_impressions;
  new.max_impressions     := old.max_impressions;
  new.total_price         := case
    when old.payment_status = 'pending' then public.ad_price_for(new.duration_days)
    else old.total_price
  end;
  return new;
end;
$$;

drop trigger if exists ads_protect_columns on ads;
-- Versión anterior de este trigger (archivo de propuestas), ya no se usa.
drop function if exists public.protect_ad_columns();
create trigger ads_protect_columns
  before insert or update on ads
  for each row execute function public.protect_ads_columns();

create or replace function public.protect_creative_request_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_privileged_request() then
    return new;
  end if;

  if public.creative_price_for(new.tier) is null then
    raise exception 'Nivel de creatividad no permitido: %', new.tier
      using errcode = 'check_violation';
  end if;

  new.price_ars := public.creative_price_for(new.tier);

  if tg_op = 'INSERT' then
    new.status := 'pending';
  else
    new.advertiser_id := old.advertiser_id;
    new.ad_id         := old.ad_id;
    -- El anunciante sólo puede volver a pedir (pending); el resto lo maneja el admin.
    if new.status is distinct from 'pending' then
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists creative_requests_protect_columns on creative_requests;
create trigger creative_requests_protect_columns
  before insert or update on creative_requests
  for each row execute function public.protect_creative_request_columns();

-- ─── CONTADOR DE IMPRESIONES DE ANUNCIOS ────────────────────────────────────
-- Antes, /api/ads/random sumaba la impresión con los permisos del visitante y
-- la base lo bloqueaba en silencio: el contador nunca subía. Además leía el
-- número y después lo guardaba +1, así que con visitas simultáneas se perdían.
--
-- Esta función elige un anuncio activo al azar (dentro de sus fechas y sin
-- superar su máximo de impresiones) y le suma 1 en un solo paso atómico.
-- Sólo la puede llamar el servidor (service role), no el navegador, para que
-- nadie pueda inflar el contador a mano.
--
-- Es seguro correrlo más de una vez. Requiere 20261102_protect_ad_prices.sql.

create or replace function public.serve_random_ad()
returns table (
  id uuid,
  title text,
  description text,
  mobile_image_url text,
  desktop_image_url text,
  target_url text,
  cta_text text,
  advertiser_name text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  picked uuid;
begin
  update ads
     set current_impressions = ads.current_impressions + 1
   where ads.id = (
     select c.id
       from ads c
      where c.status = 'active'
        and (c.starts_at is null or c.starts_at <= now())
        and (c.ends_at is null or c.ends_at >= now())
        and (c.max_impressions is null or c.current_impressions < c.max_impressions)
      order by random()
      limit 1
      for update skip locked
   )
  returning ads.id into picked;

  if picked is null then
    return;
  end if;

  return query
    select a.id, a.title, a.description, a.mobile_image_url, a.desktop_image_url,
           a.target_url, a.cta_text, adv.company_name
      from ads a
      left join advertisers adv on adv.id = a.advertiser_id
     where a.id = picked;
end;
$$;

revoke all on function public.serve_random_ad() from public;
revoke all on function public.serve_random_ad() from anon, authenticated;
grant execute on function public.serve_random_ad() to service_role;

-- ─── DOCUMENTOS PERSONALES EN UN BUCKET PRIVADO ─────────────────────────────
-- Los documentos (DNI, licencias, antecedentes, títulos, seguros) se guardaban
-- con un "link público": si el bucket "documents" era público, cualquiera con
-- el link veía el DNI de una persona; si era privado, los links no abrían.
--
-- Esta actualización:
--   1. Deja el bucket "documents" PRIVADO (y lo crea si no existe).
--   2. Convierte los registros viejos: en file_url queda sólo la ubicación del
--      archivo (ej. driver/<id>/dni_frente.jpg) en vez del link público. Los
--      que nunca se llegaron a subir ("pending:…") quedan vacíos para que la
--      persona los vuelva a subir.
--   3. Define quién puede hacer qué con los archivos:
--      - Subir / reemplazar / borrar: sólo el dueño, en su propia carpeta
--        (driver/<su perfil>/… o vehicle/<un vehículo suyo>/…).
--      - Ver: el dueño, el admin, y cualquiera que pueda ver la fila del
--        documento según las reglas de las tablas (por ejemplo, el dueño de un
--        auto ve los documentos de un conductor que se postuló).
--   4. Borra otras reglas viejas sobre este bucket (creadas a mano desde el
--      panel), para que no abran el acceso por otro lado.
--
-- La app muestra los documentos con links temporales firmados (1 hora).
-- Es seguro correrlo más de una vez.

-- 1. Bucket privado
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

-- 2. Registros viejos → ubicación dentro del bucket
update public.driver_documents
   set file_url = substring(file_url from '/storage/v1/object/(?:public|sign)/documents/([^?]+)')
 where file_url ~ '/storage/v1/object/(public|sign)/documents/';

update public.vehicle_documents
   set file_url = substring(file_url from '/storage/v1/object/(?:public|sign)/documents/([^?]+)')
 where file_url ~ '/storage/v1/object/(public|sign)/documents/';

update public.driver_documents  set file_url = null where file_url like 'pending:%';
update public.vehicle_documents set file_url = null where file_url like 'pending:%';

-- 3. Funciones auxiliares (SECURITY DEFINER: leen perfiles y vehículos sin
--    depender de sus reglas RLS, y así no hay recursión entre políticas)

-- ¿El usuario actual es dueño de la carpeta de este archivo?
create or replace function public.can_manage_document_path(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_length(storage.foldername(object_name), 1), 0) = 2
     and case (storage.foldername(object_name))[1]
           when 'driver' then exists (
             select 1 from profiles p
              where p.user_id = auth.uid()
                and p.role = 'conductor'
                and p.id::text = (storage.foldername(object_name))[2]
           )
           when 'vehicle' then exists (
             select 1 from vehicles v
               join profiles p on p.id = v.owner_id
              where p.user_id = auth.uid()
                and v.id::text = (storage.foldername(object_name))[2]
           )
           else false
         end
$$;

create or replace function public.is_documents_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
$$;

-- 4. Borrar reglas viejas sobre el bucket "documents" que no sean las de acá
do $$
declare
  pol record;
begin
  for pol in
    select policyname
      from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname not like 'Documentos:%'
       and (coalesce(qual, '') like '%''documents''%' or coalesce(with_check, '') like '%''documents''%')
  loop
    execute format('drop policy %I on storage.objects', pol.policyname);
    raise notice 'Se borró la regla vieja "%" del bucket documents', pol.policyname;
  end loop;
end
$$;

-- 3 (cont.). Reglas de acceso a los archivos
drop policy if exists "Documentos: ver" on storage.objects;
create policy "Documentos: ver" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (
      public.can_manage_document_path(name)
      or public.is_documents_admin()
      -- Estas dos consultas respetan las reglas RLS de las tablas: quien puede
      -- ver la fila del documento puede ver su archivo.
      or exists (select 1 from public.driver_documents d where d.file_url = storage.objects.name)
      or exists (select 1 from public.vehicle_documents d where d.file_url = storage.objects.name)
    )
  );

drop policy if exists "Documentos: subir" on storage.objects;
create policy "Documentos: subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.can_manage_document_path(name));

drop policy if exists "Documentos: reemplazar" on storage.objects;
create policy "Documentos: reemplazar" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and public.can_manage_document_path(name))
  with check (bucket_id = 'documents' and public.can_manage_document_path(name));

drop policy if exists "Documentos: borrar" on storage.objects;
create policy "Documentos: borrar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and public.can_manage_document_path(name));

-- ─── CUENTAS DE ANUNCIANTES SIN PERFIL DE CONDUCTOR ─────────────────────────
-- Antes, el trigger handle_new_user le creaba a TODO registro nuevo una fila en
-- "profiles" como conductor, también a los anunciantes. Por eso un anunciante
-- aparecía como usuario de la app y podía entrar a la parte de conductores.
-- Además, la fila del anunciante ("advertisers") la creaba el navegador justo
-- después de registrarse: si Supabase pide confirmar el email todavía no hay
-- sesión, la base la rechazaba y la cuenta quedaba a medias.
--
-- Ahora:
--   1. Al registrarse, la app manda account_type = 'advertiser'. Para esas
--      cuentas el trigger crea la fila en "advertisers" (en revisión) y NO crea
--      perfil de conductor. Para el resto se mantiene lo de antes, incluida la
--      corrección del archivo de propuestas (nadie se registra como admin).
--   2. Limpieza: se borran los perfiles de conductor que se crearon de más a
--      anunciantes. Sólo los que no tienen NADA asociado (vehículos,
--      postulaciones, documentos, tickets, calificaciones), siguen en plan
--      gratis y no son admin. Al terminar se muestra cuántos se borraron.
--
-- Es seguro correrlo más de una vez. Reemplaza a handle_new_user del archivo
-- de propuestas (si ya se había corrido) con la misma lógica más lo nuevo.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role text := meta->>'role';
  v_company text;
  v_website text;
begin
  -- Cuenta de anunciante: fila en advertisers, sin perfil de conductor
  if meta->>'account_type' = 'advertiser' then
    v_company := nullif(left(btrim(coalesce(meta->>'company_name', '')), 200), '');
    v_website := nullif(left(btrim(coalesce(meta->>'website', '')), 300), '');
    if v_website is not null and v_website !~* '^https?://' then
      v_website := null; -- sólo links http/https
    end if;

    insert into advertisers (user_id, company_name, contact_email, phone, website, status)
    values (
      new.id,
      coalesce(v_company, split_part(coalesce(new.email, ''), '@', 1), 'Anunciante'),
      coalesce(new.email, ''),
      nullif(left(btrim(coalesce(meta->>'phone', '')), 50), ''),
      v_website,
      'pending'
    )
    on conflict (user_id) do nothing;
    return new;
  end if;

  -- Usuario de la app: nunca se acepta 'admin' desde el registro
  if v_role is null or v_role not in ('conductor', 'propietario') then
    v_role := 'conductor';
  end if;

  insert into profiles (user_id, full_name, role, city, phone)
  values (
    new.id,
    left(coalesce(meta->>'full_name', ''), 200),
    v_role,
    left(meta->>'city', 100),
    left(meta->>'phone', 50)
  );
  return new;
end;
$$;

-- Limpieza de perfiles creados de más a anunciantes
do $$
declare
  borrados integer;
begin
  with candidatos as (
    select p.id
      from profiles p
      join advertisers a on a.user_id = p.user_id
     where p.role = 'conductor'
       and coalesce(p.plan, 'free') = 'free'
       and not exists (select 1 from vehicles v where v.owner_id = p.id)
       and not exists (select 1 from applications ap where ap.driver_id = p.id)
       and not exists (select 1 from driver_documents d where d.driver_id = p.id)
       and not exists (select 1 from support_tickets t where t.user_id = p.id)
       and not exists (select 1 from ratings r where r.from_user_id = p.id or r.to_user_id = p.id)
  )
  delete from profiles where id in (select id from candidatos);

  get diagnostics borrados = row_count;
  raise notice 'Perfiles de conductor borrados a anunciantes: %', borrados;
end
$$;
