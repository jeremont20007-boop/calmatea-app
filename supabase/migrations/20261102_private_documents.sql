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
