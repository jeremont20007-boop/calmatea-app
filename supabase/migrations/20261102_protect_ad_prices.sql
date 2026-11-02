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
--   * no pueda cambiar la duración de un anuncio ya pagado.
-- El webhook de pagos (service role) y los admins pueden cambiar todo.
--
-- Es seguro correrlo más de una vez.
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
