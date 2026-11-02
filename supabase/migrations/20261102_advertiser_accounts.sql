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
