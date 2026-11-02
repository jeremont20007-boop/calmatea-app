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
