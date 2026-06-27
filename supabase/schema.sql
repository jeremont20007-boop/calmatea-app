-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'conductor' check (role in ('conductor', 'propietario')),
  plan text not null default 'free' check (plan in ('free', 'premium')),
  city text,
  phone text,
  license_number text,
  experience_years integer,
  bio text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Vehicles table
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
  revenue_split integer not null default 60 check (revenue_split between 40 and 90),
  schedule text not null default 'completo' check (schedule in ('completo', 'parcial', 'fines_de_semana')),
  description text,
  status text not null default 'disponible' check (status in ('disponible', 'ocupado', 'pausado')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Applications table
create table if not exists applications (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  driver_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'aceptada', 'rechazada', 'retirada')),
  message text,
  owner_response text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(vehicle_id, driver_id)
);

-- RLS Policies
alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table applications enable row level security;

-- Profiles policies
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = user_id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = user_id);

create policy "Anyone can view conductor profiles for applications" on profiles
  for select using (
    role = 'conductor' and exists (
      select 1 from applications a
      join vehicles v on v.id = a.vehicle_id
      where a.driver_id = profiles.id
        and v.owner_id = (select id from profiles where user_id = auth.uid())
    )
  );

-- Vehicles policies
create policy "Anyone can view available vehicles" on vehicles
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

-- Applications policies
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

-- Function to auto-create profile on signup
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

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();

create trigger vehicles_updated_at
  before update on vehicles
  for each row execute procedure update_updated_at();

create trigger applications_updated_at
  before update on applications
  for each row execute procedure update_updated_at();
