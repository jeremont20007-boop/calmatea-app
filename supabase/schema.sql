-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'parent' check (role in ('child', 'parent', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'premium')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  favorite_sound text check (favorite_sound in ('rain', 'ocean', 'white_noise', 'brown_noise', 'forest')),
  parent_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Emotion logs
create table if not exists emotion_logs (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references profiles(id) on delete cascade not null,
  emotion text not null check (emotion in ('calm', 'happy', 'anxious', 'sad', 'angry', 'tired')),
  note text,
  sound_played text check (sound_played in ('rain', 'ocean', 'white_noise', 'brown_noise', 'forest')),
  created_at timestamptz default now()
);

-- Sound sessions
create table if not exists sound_sessions (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references profiles(id) on delete cascade not null,
  sound_category text not null check (sound_category in ('rain', 'ocean', 'white_noise', 'brown_noise', 'forest')),
  duration_seconds integer not null default 0,
  triggered_by text not null default 'manual' check (triggered_by in ('manual', 'emergency')),
  created_at timestamptz default now()
);

-- Routine progress
create table if not exists routine_progress (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references profiles(id) on delete cascade not null,
  routine_type text not null check (routine_type in ('morning', 'school', 'bath', 'sleep')),
  completed_steps integer[] not null default '{}',
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table emotion_logs enable row level security;
alter table sound_sessions enable row level security;
alter table routine_progress enable row level security;

-- Profiles policies
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = user_id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = user_id);

create policy "Parents can view child profiles" on profiles
  for select using (
    exists (
      select 1 from profiles p
      where p.user_id = auth.uid() and p.id = profiles.parent_id
    )
  );

-- Emotion logs policies
create policy "View own emotion logs" on emotion_logs
  for select using (
    exists (
      select 1 from profiles p
      where p.id = emotion_logs.child_id and (
        p.user_id = auth.uid() or
        exists (select 1 from profiles parent where parent.user_id = auth.uid() and parent.id = p.parent_id)
      )
    )
  );

create policy "Insert own emotion logs" on emotion_logs
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = child_id and p.user_id = auth.uid()
    )
  );

-- Sound sessions policies
create policy "View own sound sessions" on sound_sessions
  for select using (
    exists (
      select 1 from profiles p
      where p.id = sound_sessions.child_id and (
        p.user_id = auth.uid() or
        exists (select 1 from profiles parent where parent.user_id = auth.uid() and parent.id = p.parent_id)
      )
    )
  );

create policy "Insert own sound sessions" on sound_sessions
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = child_id and p.user_id = auth.uid()
    )
  );

-- Routine progress policies
create policy "View own routine progress" on routine_progress
  for select using (
    exists (
      select 1 from profiles p
      where p.id = routine_progress.child_id and (
        p.user_id = auth.uid() or
        exists (select 1 from profiles parent where parent.user_id = auth.uid() and parent.id = p.parent_id)
      )
    )
  );

create policy "Insert own routine progress" on routine_progress
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = child_id and p.user_id = auth.uid()
    )
  );

create policy "Update own routine progress" on routine_progress
  for update using (
    exists (
      select 1 from profiles p
      where p.id = routine_progress.child_id and p.user_id = auth.uid()
    )
  );

-- Function to auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (user_id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'parent')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Updated_at trigger
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
