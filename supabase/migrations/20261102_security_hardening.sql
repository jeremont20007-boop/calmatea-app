-- ═══════════════════════════════════════════════════════════════════════════
--  VehiLink — Endurecimiento de seguridad (RLS + triggers de protección)
--  Ejecutar UNA vez en Supabase → SQL Editor, después de schema.sql.
--  Es idempotente: se puede volver a correr sin romper nada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 0. Funciones auxiliares ────────────────────────────────────────────────
-- SECURITY DEFINER evita la recursión infinita de políticas que consultan
-- la propia tabla profiles (error 42P17 "infinite recursion detected").

create or replace function public.current_profile_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
$$;

create or replace function public.current_profile_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid()
$$;

-- true cuando quien ejecuta NO es un usuario final (service_role, postgres,
-- o una función security definer). Los usuarios de la API corren como
-- 'authenticated' o 'anon'.
create or replace function public.is_privileged()
returns boolean
language sql stable
as $$
  select current_user not in ('authenticated', 'anon')
$$;

revoke all on function public.current_profile_id() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_profile_id() to authenticated, anon;
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.is_privileged() to authenticated, anon, service_role;
grant execute on function public.current_profile_id() to service_role;
grant execute on function public.is_admin() to service_role;
grant execute on function public.current_profile_role() to service_role;

-- ─── 1. Rol admin permitido en el constraint ────────────────────────────────
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('conductor', 'propietario', 'admin'));

-- ─── 2. Alta de usuario: nunca aceptar role=admin desde metadata ────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role text := new.raw_user_meta_data->>'role';
begin
  -- Los publicitarios no tienen fila en profiles.
  if v_role = 'publicitario' then
    return new;
  end if;
  if v_role is null or v_role not in ('conductor', 'propietario') then
    v_role := 'conductor';
  end if;
  insert into public.profiles (user_id, full_name, role, city, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_role,
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ─── 3. Borrar TODAS las políticas viejas de las tablas de la app ──────────
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'vehicles', 'applications', 'driver_documents',
                        'vehicle_documents', 'support_tickets', 'ratings',
                        'advertisers', 'ads', 'creative_requests')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table profiles          enable row level security;
alter table vehicles          enable row level security;
alter table applications      enable row level security;
alter table driver_documents  enable row level security;
alter table vehicle_documents enable row level security;
alter table support_tickets   enable row level security;
alter table ratings           enable row level security;
alter table advertisers       enable row level security;
alter table ads               enable row level security;
alter table creative_requests enable row level security;

-- ─── 4. PROFILES ────────────────────────────────────────────────────────────
create policy "profiles_select_own" on profiles
  for select to authenticated using (user_id = auth.uid());

create policy "profiles_select_admin" on profiles
  for select to authenticated using (public.is_admin());

-- Contrapartes de una solicitud (dueño ↔ conductor) se ven entre sí.
create policy "profiles_select_counterparts" on profiles
  for select to authenticated using (
    exists (
      select 1 from applications a
      join vehicles v on v.id = a.vehicle_id
      where (a.driver_id = profiles.id and v.owner_id = public.current_profile_id())
         or (v.owner_id = profiles.id and a.driver_id = public.current_profile_id())
    )
  );

-- Dueños de vehículos publicados (para mostrar el nombre en el listado).
create policy "profiles_select_vehicle_owners" on profiles
  for select to authenticated using (
    exists (select 1 from vehicles v where v.owner_id = profiles.id and v.status = 'disponible')
  );

create policy "profiles_insert_own" on profiles
  for insert to authenticated with check (user_id = auth.uid());

create policy "profiles_update_own" on profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "profiles_update_admin" on profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Columnas que el usuario NO puede tocar desde el navegador: rol, plan y
-- datos de facturación. Solo el servidor (service_role) o un admin.
create or replace function public.profiles_guard()
returns trigger
language plpgsql
as $$
begin
  if public.is_privileged() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan := 'free';
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    new.subscription_status := null;
    if new.role not in ('conductor', 'propietario') then
      new.role := 'conductor';
    end if;
    return new;
  end if;

  if new.user_id                is distinct from old.user_id
  or new.role                   is distinct from old.role
  or new.plan                   is distinct from old.plan
  or new.stripe_customer_id     is distinct from old.stripe_customer_id
  or new.stripe_subscription_id is distinct from old.stripe_subscription_id
  or new.subscription_status    is distinct from old.subscription_status then
    raise exception 'No tenés permiso para modificar rol, plan o datos de facturación'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on profiles;
create trigger profiles_guard before insert or update on profiles
  for each row execute procedure public.profiles_guard();

-- ─── 5. VEHICLES ────────────────────────────────────────────────────────────
create policy "vehicles_select_available" on vehicles
  for select to authenticated using (status = 'disponible');

create policy "vehicles_select_own" on vehicles
  for select to authenticated using (owner_id = public.current_profile_id());

create policy "vehicles_select_admin" on vehicles
  for select to authenticated using (public.is_admin());

create policy "vehicles_insert_owner" on vehicles
  for insert to authenticated with check (
    owner_id = public.current_profile_id()
    and public.current_profile_role() = 'propietario'
  );

create policy "vehicles_update_owner" on vehicles
  for update to authenticated
  using (owner_id = public.current_profile_id())
  with check (owner_id = public.current_profile_id());

create policy "vehicles_delete_owner" on vehicles
  for delete to authenticated using (owner_id = public.current_profile_id());

create policy "vehicles_admin_all" on vehicles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Límite freemium: plan free = 1 vehículo.
create or replace function public.vehicles_freemium_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_plan text;
begin
  select plan into v_plan from profiles where id = new.owner_id;
  if coalesce(v_plan, 'free') <> 'premium'
     and (select count(*) from vehicles where owner_id = new.owner_id) >= 1 then
    raise exception 'Límite del plan gratuito: 1 vehículo' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists vehicles_freemium_limit on vehicles;
create trigger vehicles_freemium_limit before insert on vehicles
  for each row execute procedure public.vehicles_freemium_limit();

-- ─── 6. APPLICATIONS ────────────────────────────────────────────────────────
create policy "applications_select_driver" on applications
  for select to authenticated using (driver_id = public.current_profile_id());

create policy "applications_select_owner" on applications
  for select to authenticated using (
    exists (select 1 from vehicles v
            where v.id = applications.vehicle_id and v.owner_id = public.current_profile_id())
  );

create policy "applications_select_admin" on applications
  for select to authenticated using (public.is_admin());

create policy "applications_insert_driver" on applications
  for insert to authenticated with check (
    driver_id = public.current_profile_id()
    and status = 'pendiente'
    and owner_response is null
    and public.current_profile_role() = 'conductor'
    and exists (select 1 from vehicles v where v.id = vehicle_id and v.status = 'disponible')
  );

create policy "applications_update_driver" on applications
  for update to authenticated
  using (driver_id = public.current_profile_id() and status = 'pendiente')
  with check (driver_id = public.current_profile_id() and status in ('pendiente', 'retirada'));

create policy "applications_update_owner" on applications
  for update to authenticated
  using (exists (select 1 from vehicles v
                 where v.id = applications.vehicle_id and v.owner_id = public.current_profile_id()))
  with check (exists (select 1 from vehicles v
                 where v.id = applications.vehicle_id and v.owner_id = public.current_profile_id())
              and status in ('pendiente', 'aceptada', 'rechazada'));

create or replace function public.applications_guard()
returns trigger
language plpgsql
as $$
declare me uuid := public.current_profile_id();
begin
  if public.is_privileged() or public.is_admin() then
    return new;
  end if;

  if new.vehicle_id is distinct from old.vehicle_id
  or new.driver_id  is distinct from old.driver_id then
    raise exception 'No se puede cambiar el vehículo o el conductor de una solicitud' using errcode = '42501';
  end if;

  if old.driver_id = me then
    -- El conductor solo puede editar su propuesta o retirarla; no puede responderse a sí mismo.
    if new.owner_response is distinct from old.owner_response
    or new.status not in ('pendiente', 'retirada') then
      raise exception 'Acción no permitida' using errcode = '42501';
    end if;
  else
    -- El dueño solo puede cambiar el estado y su respuesta.
    if new.message                   is distinct from old.message
    or new.driver_offered_split      is distinct from old.driver_offered_split
    or new.driver_available_days     is distinct from old.driver_available_days
    or new.driver_schedule           is distinct from old.driver_schedule
    or new.accepted_legal_disclaimer is distinct from old.accepted_legal_disclaimer
    or old.status = 'retirada' then
      raise exception 'Acción no permitida' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists applications_guard on applications;
create trigger applications_guard before update on applications
  for each row execute procedure public.applications_guard();

-- Límite freemium: plan free = 3 solicitudes activas.
create or replace function public.applications_freemium_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_plan text;
begin
  select plan into v_plan from profiles where id = new.driver_id;
  if coalesce(v_plan, 'free') <> 'premium'
     and (select count(*) from applications
          where driver_id = new.driver_id and status not in ('retirada', 'rechazada')) >= 3 then
    raise exception 'Límite del plan gratuito: 3 solicitudes activas' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists applications_freemium_limit on applications;
create trigger applications_freemium_limit before insert on applications
  for each row execute procedure public.applications_freemium_limit();

-- ─── 7. DOCUMENTOS ──────────────────────────────────────────────────────────
create policy "driver_docs_own" on driver_documents
  for all to authenticated
  using (driver_id = public.current_profile_id())
  with check (driver_id = public.current_profile_id());

create policy "driver_docs_owner_of_accepted" on driver_documents
  for select to authenticated using (
    exists (select 1 from applications a
            join vehicles v on v.id = a.vehicle_id
            where a.driver_id = driver_documents.driver_id
              and v.owner_id = public.current_profile_id()
              and a.status = 'aceptada')
  );

create policy "driver_docs_admin" on driver_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "vehicle_docs_own" on vehicle_documents
  for all to authenticated
  using (exists (select 1 from vehicles v
                 where v.id = vehicle_documents.vehicle_id and v.owner_id = public.current_profile_id()))
  with check (exists (select 1 from vehicles v
                 where v.id = vehicle_documents.vehicle_id and v.owner_id = public.current_profile_id()));

create policy "vehicle_docs_accepted_driver" on vehicle_documents
  for select to authenticated using (
    exists (select 1 from applications a
            where a.vehicle_id = vehicle_documents.vehicle_id
              and a.driver_id = public.current_profile_id()
              and a.status = 'aceptada')
  );

create policy "vehicle_docs_admin" on vehicle_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- El usuario no puede auto-aprobarse documentos: solo el admin cambia status/notes.
create or replace function public.documents_guard()
returns trigger
language plpgsql
as $$
begin
  if public.is_privileged() or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pendiente';
    new.notes := null;
  else
    if new.status is distinct from old.status and new.status <> 'pendiente' then
      raise exception 'Solo un administrador puede aprobar o rechazar documentos' using errcode = '42501';
    end if;
    new.notes := old.notes;
  end if;
  return new;
end;
$$;

drop trigger if exists driver_documents_guard on driver_documents;
create trigger driver_documents_guard before insert or update on driver_documents
  for each row execute procedure public.documents_guard();

drop trigger if exists vehicle_documents_guard on vehicle_documents;
create trigger vehicle_documents_guard before insert or update on vehicle_documents
  for each row execute procedure public.documents_guard();

-- ─── 8. SUPPORT TICKETS ─────────────────────────────────────────────────────
create policy "tickets_select_own" on support_tickets
  for select to authenticated using (user_id = public.current_profile_id());

create policy "tickets_insert_own" on support_tickets
  for insert to authenticated with check (
    user_id = public.current_profile_id()
    and status = 'abierto'
    and admin_response is null
  );

create policy "tickets_admin_select" on support_tickets
  for select to authenticated using (public.is_admin());

create policy "tickets_admin_update" on support_tickets
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── 9. RATINGS ─────────────────────────────────────────────────────────────
create policy "ratings_select" on ratings
  for select to authenticated using (true);

-- Solo se puede calificar a alguien con quien hubo una solicitud aceptada.
create policy "ratings_insert_own" on ratings
  for insert to authenticated with check (
    from_user_id = public.current_profile_id()
    and exists (
      select 1 from applications a
      join vehicles v on v.id = a.vehicle_id
      where a.status = 'aceptada'
        and ((a.driver_id = from_user_id and v.owner_id = to_user_id)
          or (v.owner_id = from_user_id and a.driver_id = to_user_id))
    )
  );

create policy "ratings_update_own" on ratings
  for update to authenticated
  using (from_user_id = public.current_profile_id())
  with check (from_user_id = public.current_profile_id());

create or replace function public.ratings_guard()
returns trigger
language plpgsql
as $$
begin
  if public.is_privileged() then return new; end if;
  if new.from_user_id is distinct from old.from_user_id
  or new.to_user_id   is distinct from old.to_user_id
  or new.vehicle_id   is distinct from old.vehicle_id then
    raise exception 'Acción no permitida' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists ratings_guard on ratings;
create trigger ratings_guard before update on ratings
  for each row execute procedure public.ratings_guard();

-- ─── 10. ADVERTISERS ────────────────────────────────────────────────────────
create policy "advertisers_select_own" on advertisers
  for select to authenticated using (user_id = auth.uid());

create policy "advertisers_insert_own" on advertisers
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending');

create policy "advertisers_update_own" on advertisers
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "advertisers_admin_all" on advertisers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.advertisers_guard()
returns trigger
language plpgsql
as $$
begin
  if public.is_privileged() or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
  elsif new.status is distinct from old.status or new.user_id is distinct from old.user_id then
    raise exception 'Solo un administrador puede cambiar el estado del publicitario' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists advertisers_guard on advertisers;
create trigger advertisers_guard before insert or update on advertisers
  for each row execute procedure public.advertisers_guard();

-- ─── 11. ADS ────────────────────────────────────────────────────────────────
create policy "ads_select_active" on ads
  for select to anon, authenticated using (status = 'active');

create policy "ads_select_own" on ads
  for select to authenticated using (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
  );

create policy "ads_insert_own" on ads
  for insert to authenticated with check (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
  );

create policy "ads_update_own" on ads
  for update to authenticated
  using (advertiser_id in (select id from advertisers where user_id = auth.uid()))
  with check (advertiser_id in (select id from advertisers where user_id = auth.uid()));

create policy "ads_admin_all" on ads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Precio por duración (debe coincidir con calcAdPrice en types/index.ts).
create or replace function public.ad_price_for(p_days integer)
returns numeric
language sql immutable
as $$
  select round(500 * (1 - case p_days
      when 7  then 0
      when 14 then 0.05
      when 30 then 0.10
      when 60 then 0.15
      when 90 then 0.20
    end) * p_days)
$$;

-- El publicitario no puede: fijar el precio, marcar como pagado, activar su
-- anuncio, cambiar fechas/impresiones, ni editar el contenido después de la
-- aprobación (p. ej. cambiar la URL de destino de un anuncio activo).
create or replace function public.ads_guard()
returns trigger
language plpgsql
as $$
begin
  if public.is_privileged() or public.is_admin() then return new; end if;

  -- Evita links javascript:/data: en el banner.
  if new.target_url !~* '^https?://' then
    raise exception 'La URL de destino debe comenzar con http:// o https://' using errcode = '22023';
  end if;

  if new.duration_days is null or new.duration_days not in (7, 14, 30, 60, 90) then
    raise exception 'Duración inválida' using errcode = '22023';
  end if;

  if tg_op = 'INSERT' then
    new.status := 'draft';
    new.payment_status := 'pending';
    new.current_impressions := 0;
    new.max_impressions := null;
    new.starts_at := null;
    new.ends_at := null;
    new.total_price := public.ad_price_for(new.duration_days);
    return new;
  end if;

  if new.advertiser_id       is distinct from old.advertiser_id
  or new.status              is distinct from old.status
  or new.payment_status      is distinct from old.payment_status
  or new.current_impressions is distinct from old.current_impressions
  or new.max_impressions     is distinct from old.max_impressions
  or new.starts_at           is distinct from old.starts_at
  or new.ends_at             is distinct from old.ends_at then
    raise exception 'Acción no permitida sobre el anuncio' using errcode = '42501';
  end if;

  if old.status not in ('draft', 'rejected') then
    raise exception 'Solo se pueden editar anuncios en borrador o rechazados' using errcode = '42501';
  end if;

  if old.payment_status = 'paid' and new.duration_days is distinct from old.duration_days then
    raise exception 'No se puede cambiar la duración de un anuncio pagado' using errcode = '42501';
  end if;

  new.total_price := public.ad_price_for(new.duration_days);
  return new;
end;
$$;

drop trigger if exists ads_guard on ads;
create trigger ads_guard before insert or update on ads
  for each row execute procedure public.ads_guard();

-- Conteo de impresiones sin dar UPDATE sobre ads a los usuarios.
create or replace function public.increment_ad_impression(p_ad_id uuid)
returns void
language sql security definer set search_path = public
as $$
  update ads set current_impressions = current_impressions + 1
  where id = p_ad_id and status = 'active'
$$;

revoke all on function public.increment_ad_impression(uuid) from public;
grant execute on function public.increment_ad_impression(uuid) to anon, authenticated, service_role;

-- ─── 12. CREATIVE REQUESTS ──────────────────────────────────────────────────
create policy "creative_select_own" on creative_requests
  for select to authenticated using (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
  );

create policy "creative_insert_own" on creative_requests
  for insert to authenticated with check (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
    and ad_id in (select a.id from ads a join advertisers adv on adv.id = a.advertiser_id
                  where adv.user_id = auth.uid())
  );

create policy "creative_update_own" on creative_requests
  for update to authenticated
  using (advertiser_id in (select id from advertisers where user_id = auth.uid()))
  with check (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
    and ad_id in (select a.id from ads a join advertisers adv on adv.id = a.advertiser_id
                  where adv.user_id = auth.uid())
  );

create policy "creative_admin_all" on creative_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Precio por nivel (debe coincidir con CREATIVE_TIERS en types/index.ts).
create or replace function public.creative_price_for(p_tier integer)
returns numeric
language sql immutable
as $$
  select case p_tier
    when 1 then 5000 when 2 then 12000 when 3 then 22000 when 4 then 35000
    when 5 then 52000 when 6 then 75000 when 7 then 110000
  end
$$;

create or replace function public.creative_requests_guard()
returns trigger
language plpgsql
as $$
begin
  if public.is_privileged() or public.is_admin() then return new; end if;

  new.price_ars := public.creative_price_for(new.tier);

  if tg_op = 'INSERT' then
    new.status := 'pending';
  elsif new.status is distinct from old.status and new.status <> 'pending' then
    raise exception 'Solo un administrador puede cambiar el estado de la solicitud' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists creative_requests_guard on creative_requests;
create trigger creative_requests_guard before insert or update on creative_requests
  for each row execute procedure public.creative_requests_guard();

-- ─── 13. STORAGE ────────────────────────────────────────────────────────────
-- Bucket "documents" (PRIVADO). Rutas: driver/<profile_id>/<doc>.ext
--                                       vehicle/<vehicle_id>/<doc>.ext
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('ads-media', 'ads-media', true)
on conflict (id) do nothing;

drop policy if exists "documents_owner_rw" on storage.objects;
create policy "documents_owner_rw" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'documents' and (
      ((storage.foldername(name))[1] = 'driver'
        and (storage.foldername(name))[2] = public.current_profile_id()::text)
      or ((storage.foldername(name))[1] = 'vehicle'
        and (storage.foldername(name))[2] in (
          select id::text from public.vehicles where owner_id = public.current_profile_id()))
    )
  )
  with check (
    bucket_id = 'documents' and (
      ((storage.foldername(name))[1] = 'driver'
        and (storage.foldername(name))[2] = public.current_profile_id()::text)
      or ((storage.foldername(name))[1] = 'vehicle'
        and (storage.foldername(name))[2] in (
          select id::text from public.vehicles where owner_id = public.current_profile_id()))
    )
  );

drop policy if exists "documents_admin_read" on storage.objects;
create policy "documents_admin_read" on storage.objects
  for select to authenticated using (bucket_id = 'documents' and public.is_admin());

drop policy if exists "ads_media_owner_write" on storage.objects;
create policy "ads_media_owner_write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'ads-media'
    and (storage.foldername(name))[1] in (select id::text from public.advertisers where user_id = auth.uid())
  );

drop policy if exists "ads_media_owner_update" on storage.objects;
create policy "ads_media_owner_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'ads-media'
    and (storage.foldername(name))[1] in (select id::text from public.advertisers where user_id = auth.uid())
  );

drop policy if exists "ads_media_public_read" on storage.objects;
create policy "ads_media_public_read" on storage.objects
  for select using (bucket_id = 'ads-media');
