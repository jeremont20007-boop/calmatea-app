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
-- Run these in the Supabase Storage dashboard or via API:
-- 1. Create a bucket named "documents" (private)
-- 2. Enable RLS on the bucket
-- Storage policies are managed via the Supabase dashboard

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
