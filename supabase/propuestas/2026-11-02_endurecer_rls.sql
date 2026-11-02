-- ═══════════════════════════════════════════════════════════════════════════
--  PROPUESTA DE SEGURIDAD PARA LA BASE DE DATOS — **NO FUE APLICADA**
-- ═══════════════════════════════════════════════════════════════════════════
--
--  Este archivo NO se ejecuta solo. Está fuera de `supabase/migrations` a
--  propósito, para que ninguna integración lo aplique automáticamente.
--
--  Cómo usarlo (recomendado):
--    1. Hacer una copia de seguridad del proyecto de Supabase.
--    2. Probarlo primero en un proyecto de prueba (o en una "branch" de Supabase).
--    3. Pegarlo en Supabase → SQL Editor → Run.
--    4. Probar: registro, login, publicar vehículo, postularse, aceptar
--       postulación, subir documentos, calificar, crear anuncio y pagar.
--
--  Todo corre dentro de una transacción: si algo falla, no se aplica nada.
--
--  Qué arregla (resumen):
--   A. Nadie puede auto-asignarse rol "admin" ni plan "premium".
--   B. Postulaciones: reglas explícitas de qué estados puede poner cada uno
--      (el auto-aceptarse ya estaba bloqueado; ahora queda explícito).
--   C. Nadie puede auto-aprobar sus propios documentos.
--   D. Un publicitario no puede activar su anuncio sin pagar ni sin revisión,
--      ni auto-aprobar su cuenta.
--   E. Arregla la política de `profiles` que se consultaba a sí misma.
--      Con schema.sql tal cual, TODAS las consultas de usuarios logueados
--      fallan con "infinite recursion detected in policy" (probado).
--   F. Le da al admin permiso de LECTURA de perfiles, vehículos y documentos
--      (el panel de admin hoy no puede verlos por RLS).
--   G. Solo se puede calificar a alguien con quien hubo una postulación aceptada.
--   H. Los usuarios no pueden cambiar el estado/respuesta de sus tickets.
--   I. Los vehículos disponibles ya no se ven sin iniciar sesión.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ─── 0. AMPLIAR EL CHECK DE ROL PARA INCLUIR 'admin' ────────────────────────
-- (el panel de admin lo necesita; en schema.sql estaba comentado)
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('conductor', 'propietario', 'admin'));

-- ─── 1. FUNCIONES AUXILIARES ────────────────────────────────────────────────
-- SECURITY DEFINER = se ejecutan sin RLS, lo que evita la recursión infinita
-- de políticas que se consultan entre sí.

create or replace function public.my_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from profiles where user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
$$;

-- true cuando quien escribe es el servidor (service_role, usado por los webhooks
-- de pago) o el dueño de la base desde el SQL Editor.
create or replace function public.is_trusted_writer()
returns boolean language sql stable as $$
  select coalesce(auth.role(), '') = 'service_role'
      or current_user in ('postgres', 'supabase_admin')
$$;

create or replace function public.owns_vehicle(p_vehicle_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vehicles v
    where v.id = p_vehicle_id
      and v.owner_id = (select id from profiles where user_id = auth.uid())
  )
$$;

-- ¿El usuario actual es dueño de un vehículo al que este conductor se postuló?
create or replace function public.driver_applied_to_my_vehicle(p_driver_id uuid, p_only_accepted boolean)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from applications a
    join vehicles v on v.id = a.vehicle_id
    where a.driver_id = p_driver_id
      and v.owner_id = (select id from profiles where user_id = auth.uid())
      and (not p_only_accepted or a.status = 'aceptada')
  )
$$;

-- ¿Hubo una postulación aceptada entre estos dos perfiles (en cualquier sentido)?
create or replace function public.have_accepted_link(p_a uuid, p_b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from applications ap
    join vehicles v on v.id = ap.vehicle_id
    where ap.status = 'aceptada'
      and ((ap.driver_id = p_a and v.owner_id = p_b)
        or (ap.driver_id = p_b and v.owner_id = p_a))
  )
$$;

-- ─── 2. ALTA DE USUARIOS: NO ACEPTAR ROL 'admin' DESDE EL REGISTRO ──────────
-- Antes, el rol venía tal cual de los datos que manda el navegador al registrarse.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := new.raw_user_meta_data->>'role';
begin
  if v_role is null or v_role not in ('conductor', 'propietario') then
    v_role := 'conductor';
  end if;

  insert into profiles (user_id, full_name, role, city, phone)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name', ''), 200),
    v_role,
    left(new.raw_user_meta_data->>'city', 100),
    left(new.raw_user_meta_data->>'phone', 50)
  );
  return new;
end;
$$;

-- ─── 3. PROFILES ────────────────────────────────────────────────────────────

-- Campos que un usuario NO puede tocarse a sí mismo: plan, suscripción,
-- ids de Stripe y rol admin.
create or replace function protect_profile_columns()
returns trigger language plpgsql as $$
begin
  if public.is_trusted_writer() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan := 'free';
    new.subscription_status := null;
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    if new.role not in ('conductor', 'propietario') then
      new.role := 'conductor';
    end if;
    return new;
  end if;

  if new.plan is distinct from old.plan
     or new.subscription_status is distinct from old.subscription_status
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id
     or new.user_id is distinct from old.user_id then
    raise exception 'No tenés permiso para modificar estos datos';
  end if;

  if new.role is distinct from old.role
     and (old.role = 'admin' or new.role not in ('conductor', 'propietario')) then
    raise exception 'No tenés permiso para cambiar el rol';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on profiles;
create trigger profiles_protect_columns
  before insert or update on profiles
  for each row execute procedure protect_profile_columns();

-- Política que se consultaba a sí misma → reemplazada usando funciones auxiliares.
drop policy if exists "Owners can view driver profiles of applicants" on profiles;
create policy "Owners can view driver profiles of applicants" on profiles
  for select using (
    role = 'conductor' and public.driver_applied_to_my_vehicle(profiles.id, false)
  );

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Admins can view all profiles" on profiles;
create policy "Admins can view all profiles" on profiles
  for select using (public.is_admin());

-- ─── 4. VEHICLES ────────────────────────────────────────────────────────────

drop policy if exists "Anyone logged in can view available vehicles" on vehicles;
create policy "Anyone logged in can view available vehicles" on vehicles
  for select using (status = 'disponible' and auth.uid() is not null);

drop policy if exists "Owners can update their vehicles" on vehicles;
create policy "Owners can update their vehicles" on vehicles
  for update using (owner_id = public.my_profile_id())
  with check (owner_id = public.my_profile_id());

drop policy if exists "Admins can view all vehicles" on vehicles;
create policy "Admins can view all vehicles" on vehicles
  for select using (public.is_admin());

-- ─── 5. APPLICATIONS (postulaciones) ────────────────────────────────────────

drop policy if exists "Drivers can insert applications" on applications;
create policy "Drivers can insert applications" on applications
  for insert with check (
    driver_id = public.my_profile_id() and status = 'pendiente'
  );

-- Se hace explícito qué estados puede poner cada parte.
drop policy if exists "Drivers can update own pending applications" on applications;
create policy "Drivers can update own pending applications" on applications
  for update using (driver_id = public.my_profile_id() and status = 'pendiente')
  with check (driver_id = public.my_profile_id() and status in ('pendiente', 'retirada'));

drop policy if exists "Owners can update applications for their vehicles" on applications;
create policy "Owners can update applications for their vehicles" on applications
  for update using (public.owns_vehicle(vehicle_id))
  with check (public.owns_vehicle(vehicle_id) and status in ('pendiente', 'aceptada', 'rechazada'));

-- Nadie (salvo el servidor) puede mover una postulación a otro vehículo/conductor.
create or replace function protect_application_columns()
returns trigger language plpgsql as $$
begin
  if public.is_trusted_writer() then return new; end if;
  if new.vehicle_id is distinct from old.vehicle_id
     or new.driver_id is distinct from old.driver_id then
    raise exception 'No se puede cambiar el vehículo o el conductor de una postulación';
  end if;
  return new;
end;
$$;

drop trigger if exists applications_protect_columns on applications;
create trigger applications_protect_columns
  before update on applications
  for each row execute procedure protect_application_columns();

-- ─── 6. DRIVER DOCUMENTS ────────────────────────────────────────────────────
-- Antes: "for all" permitía al conductor marcar sus documentos como 'aprobado'.

drop policy if exists "Drivers can manage own documents" on driver_documents;
drop policy if exists "Drivers can view own documents" on driver_documents;
drop policy if exists "Drivers can upload own documents" on driver_documents;
drop policy if exists "Drivers can replace own documents" on driver_documents;
drop policy if exists "Drivers can delete own documents" on driver_documents;
drop policy if exists "Admins can view all driver documents" on driver_documents;
drop policy if exists "Admins can review driver documents" on driver_documents;

create policy "Drivers can view own documents" on driver_documents
  for select using (driver_id = public.my_profile_id());
create policy "Drivers can upload own documents" on driver_documents
  for insert with check (driver_id = public.my_profile_id() and status = 'pendiente');
create policy "Drivers can replace own documents" on driver_documents
  for update using (driver_id = public.my_profile_id())
  with check (driver_id = public.my_profile_id() and status = 'pendiente');
create policy "Drivers can delete own documents" on driver_documents
  for delete using (driver_id = public.my_profile_id());

drop policy if exists "Owners can view docs of applicants" on driver_documents;
create policy "Owners can view docs of applicants" on driver_documents
  for select using (public.driver_applied_to_my_vehicle(driver_id, true));

create policy "Admins can view all driver documents" on driver_documents
  for select using (public.is_admin());
create policy "Admins can review driver documents" on driver_documents
  for update using (public.is_admin()) with check (public.is_admin());

-- ─── 7. VEHICLE DOCUMENTS ───────────────────────────────────────────────────

drop policy if exists "Owners can manage own vehicle documents" on vehicle_documents;
drop policy if exists "Owners can view own vehicle documents" on vehicle_documents;
drop policy if exists "Owners can upload vehicle documents" on vehicle_documents;
drop policy if exists "Owners can replace vehicle documents" on vehicle_documents;
drop policy if exists "Owners can delete vehicle documents" on vehicle_documents;
drop policy if exists "Admins can view all vehicle documents" on vehicle_documents;
drop policy if exists "Admins can review vehicle documents" on vehicle_documents;

create policy "Owners can view own vehicle documents" on vehicle_documents
  for select using (public.owns_vehicle(vehicle_id));
create policy "Owners can upload vehicle documents" on vehicle_documents
  for insert with check (public.owns_vehicle(vehicle_id) and status = 'pendiente');
create policy "Owners can replace vehicle documents" on vehicle_documents
  for update using (public.owns_vehicle(vehicle_id))
  with check (public.owns_vehicle(vehicle_id) and status = 'pendiente');
create policy "Owners can delete vehicle documents" on vehicle_documents
  for delete using (public.owns_vehicle(vehicle_id));

create policy "Admins can view all vehicle documents" on vehicle_documents
  for select using (public.is_admin());
create policy "Admins can review vehicle documents" on vehicle_documents
  for update using (public.is_admin()) with check (public.is_admin());

-- ─── 8. SUPPORT TICKETS ─────────────────────────────────────────────────────
-- Antes: el usuario podía editar el estado y la "respuesta del admin" de su ticket.

drop policy if exists "Users can manage own tickets" on support_tickets;
drop policy if exists "Users can view own tickets" on support_tickets;
drop policy if exists "Users can create own tickets" on support_tickets;

create policy "Users can view own tickets" on support_tickets
  for select using (user_id = public.my_profile_id());
create policy "Users can create own tickets" on support_tickets
  for insert with check (
    user_id = public.my_profile_id() and status = 'abierto' and admin_response is null
  );

-- ─── 9. RATINGS ─────────────────────────────────────────────────────────────

drop policy if exists "Users can insert own ratings" on ratings;
create policy "Users can insert own ratings" on ratings
  for insert with check (
    from_user_id = public.my_profile_id()
    and public.have_accepted_link(from_user_id, to_user_id)
  );

drop policy if exists "Users can update own ratings" on ratings;
create policy "Users can update own ratings" on ratings
  for update using (from_user_id = public.my_profile_id())
  with check (from_user_id = public.my_profile_id());

-- ─── 10. ADVERTISERS ────────────────────────────────────────────────────────
-- Antes: el publicitario podía ponerse a sí mismo status = 'active'.

drop policy if exists "Advertisers can insert own record" on advertisers;
create policy "Advertisers can insert own record" on advertisers
  for insert with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Advertisers can update own record" on advertisers;
create policy "Advertisers can update own record" on advertisers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function protect_advertiser_columns()
returns trigger language plpgsql as $$
begin
  if public.is_trusted_writer() or public.is_admin() then return new; end if;
  if new.status is distinct from old.status or new.user_id is distinct from old.user_id then
    raise exception 'No tenés permiso para modificar estos datos';
  end if;
  return new;
end;
$$;

drop trigger if exists advertisers_protect_columns on advertisers;
create trigger advertisers_protect_columns
  before update on advertisers
  for each row execute procedure protect_advertiser_columns();

-- ─── 11. ADS ────────────────────────────────────────────────────────────────
-- Antes: el publicitario podía poner su anuncio en 'active' y payment_status
-- 'paid' sin pagar, o editar un anuncio ya aprobado sin nueva revisión.

drop policy if exists "Advertisers can insert own ads" on ads;
create policy "Advertisers can insert own ads" on ads
  for insert with check (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
    and status = 'draft'
    and payment_status = 'pending'
    and current_impressions = 0
  );

drop policy if exists "Advertisers can update own ads" on ads;
create policy "Advertisers can update own ads" on ads
  for update using (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
  ) with check (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
  );

create or replace function protect_ad_columns()
returns trigger language plpgsql as $$
begin
  if public.is_trusted_writer() or public.is_admin() then return new; end if;

  if new.status is distinct from old.status
     or new.payment_status is distinct from old.payment_status
     or new.total_price is distinct from old.total_price
     or new.current_impressions is distinct from old.current_impressions
     or new.max_impressions is distinct from old.max_impressions
     or new.starts_at is distinct from old.starts_at
     or new.ends_at is distinct from old.ends_at
     or new.advertiser_id is distinct from old.advertiser_id then
    raise exception 'No tenés permiso para modificar estos datos del anuncio';
  end if;

  -- El contenido solo se edita en borrador o si fue rechazado (igual que la app).
  if old.status not in ('draft', 'rejected') then
    raise exception 'Este anuncio ya no se puede editar';
  end if;

  -- Tampoco se puede cambiar la duración una vez pagado.
  if old.payment_status = 'paid' and new.duration_days is distinct from old.duration_days then
    raise exception 'No se puede cambiar la duración de un anuncio pagado';
  end if;

  return new;
end;
$$;

drop trigger if exists ads_protect_columns on ads;
create trigger ads_protect_columns
  before update on ads
  for each row execute procedure protect_ad_columns();

-- ─── 12. CREATIVE REQUESTS ──────────────────────────────────────────────────
-- Antes: "for all" permitía al publicitario cambiarse el estado.
-- NOTA: el precio (price_ars) lo sigue mandando el navegador. Hoy no se cobra
-- online, pero si en el futuro se cobra, hay que calcularlo en el servidor.

drop policy if exists "Advertisers can manage own creative requests" on creative_requests;
drop policy if exists "Advertisers can view own creative requests" on creative_requests;
drop policy if exists "Advertisers can create creative requests" on creative_requests;
drop policy if exists "Advertisers can edit pending creative requests" on creative_requests;

create policy "Advertisers can view own creative requests" on creative_requests
  for select using (advertiser_id in (select id from advertisers where user_id = auth.uid()));
create policy "Advertisers can create creative requests" on creative_requests
  for insert with check (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
    and ad_id in (
      select a.id from ads a
      join advertisers adv on adv.id = a.advertiser_id
      where adv.user_id = auth.uid()
    )
    and status = 'pending'
  );
create policy "Advertisers can edit pending creative requests" on creative_requests
  for update using (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
    and status in ('pending', 'delivered', 'revision')
  ) with check (
    advertiser_id in (select id from advertisers where user_id = auth.uid())
    and status in ('pending', 'revision')
  );

commit;

-- ═══════════════════════════════════════════════════════════════════════════
--  STORAGE (se configura en el panel: Storage → Policies). No incluido arriba.
-- ═══════════════════════════════════════════════════════════════════════════
--  Bucket "documents" (DNI, licencias, antecedentes): DEBE ser PRIVADO.
--  Hoy la app guarda un "public URL" de ese bucket: si el bucket es privado,
--  esos links no abren; si es público, cualquiera con el link ve el DNI.
--  Lo correcto es mantenerlo privado y que la app genere links temporales
--  (signed URLs). Ver la descripción del Pull Request.
--
--  Bucket "ads-media": público para lectura está bien. Para subir, la política
--  sugerida en schema.sql (carpeta = id del publicitario) es correcta.
