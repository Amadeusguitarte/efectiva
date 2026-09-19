-- ============================================================================
-- Base de la plataforma Insolvencia Efectiva
--
-- Modelo:
--   perfiles            1 por usuario de Supabase Auth; define el rol (admin | cliente).
--   clientes            expediente del cliente final. Puede existir antes de que el
--                       cliente se registre; se vincula por correo al entrar con Google.
--   propuestas          propuesta legal del cliente (una por cliente) y su estado.
--   propuesta_eventos   historial de estados visible para el cliente.
--   notas_internas      notas del equipo, nunca visibles para el cliente.
--   consentimientos     autorizaciones de tratamiento de datos (Ley 1581 de 2012).
--
-- Seguridad: RLS en todas las tablas. El rol admin solo se asigna por SQL.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.rol_usuario as enum ('admin', 'cliente');

create type public.estado_propuesta as enum (
  'pendiente',
  'requiere_informacion',
  'en_diagnostico',
  'en_elaboracion',
  'verificando',
  'finalizada',
  'cancelada'
);

create type public.tipo_documento as enum ('CC', 'CE', 'PA', 'PPT');

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- perfiles
-- ---------------------------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre_completo text,
  avatar_url text,
  rol public.rol_usuario not null default 'cliente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.perfiles is 'Perfil y rol de cada usuario autenticado.';

create index perfiles_rol_idx on public.perfiles (rol);

create trigger perfiles_set_updated_at
before update on public.perfiles
for each row execute function public.set_updated_at();

-- Devuelve true si el usuario actual es administrador.
-- SECURITY DEFINER evita la recursión de RLS al consultar perfiles desde sus propias políticas.
create function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'admin'
  );
$$;

revoke execute on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- clientes
-- ---------------------------------------------------------------------------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid unique references public.perfiles (id) on delete set null,
  nombre_completo text not null check (char_length(nombre_completo) between 2 and 160),
  email text not null check (position('@' in email) > 1),
  telefono text,
  tipo_documento public.tipo_documento,
  numero_documento text,
  ciudad text,
  origen text not null default 'registro_web' check (origen in ('registro_web', 'creado_por_admin')),
  created_by uuid references public.perfiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clientes_documento_completo check (
    (tipo_documento is null) = (numero_documento is null)
  )
);

comment on table public.clientes is 'Expediente de cada cliente final.';

create unique index clientes_email_key on public.clientes (lower(email));
create unique index clientes_documento_key on public.clientes (tipo_documento, numero_documento)
  where numero_documento is not null;
create index clientes_created_at_idx on public.clientes (created_at desc);

create trigger clientes_set_updated_at
before update on public.clientes
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- propuestas
-- ---------------------------------------------------------------------------
create table public.propuestas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null unique references public.clientes (id) on delete cascade,
  estado public.estado_propuesta not null default 'pendiente',
  mensaje_cliente text check (char_length(mensaje_cliente) <= 1000),
  documento_path text,
  finalizada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint propuestas_finalizada_con_documento check (
    estado <> 'finalizada' or documento_path is not null
  )
);

comment on table public.propuestas is 'Propuesta legal de cada cliente y su estado actual.';
comment on column public.propuestas.mensaje_cliente is 'Mensaje visible para el cliente sobre el estado actual.';
comment on column public.propuestas.documento_path is 'Ruta del documento final en el bucket "propuestas".';

create index propuestas_estado_idx on public.propuestas (estado);

create function public.propuestas_antes_de_guardar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  if new.estado = 'finalizada' and (tg_op = 'INSERT' or old.estado is distinct from 'finalizada') then
    new.finalizada_at = now();
  elsif new.estado <> 'finalizada' then
    new.finalizada_at = null;
  end if;
  return new;
end;
$$;

create trigger propuestas_antes_de_guardar
before insert or update on public.propuestas
for each row execute function public.propuestas_antes_de_guardar();

-- ---------------------------------------------------------------------------
-- propuesta_eventos (historial visible para el cliente)
-- ---------------------------------------------------------------------------
create table public.propuesta_eventos (
  id bigint generated always as identity primary key,
  propuesta_id uuid not null references public.propuestas (id) on delete cascade,
  estado_anterior public.estado_propuesta,
  estado_nuevo public.estado_propuesta not null,
  mensaje text,
  creado_por uuid references public.perfiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.propuesta_eventos is 'Historial de cambios de estado y mensajes de cada propuesta.';

create index propuesta_eventos_propuesta_idx on public.propuesta_eventos (propuesta_id, created_at desc);

create function public.registrar_evento_propuesta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.propuesta_eventos (propuesta_id, estado_anterior, estado_nuevo, mensaje, creado_por)
    values (new.id, null, new.estado, new.mensaje_cliente, (select auth.uid()));
  elsif new.estado is distinct from old.estado
     or new.mensaje_cliente is distinct from old.mensaje_cliente then
    insert into public.propuesta_eventos (propuesta_id, estado_anterior, estado_nuevo, mensaje, creado_por)
    values (new.id, old.estado, new.estado, new.mensaje_cliente, (select auth.uid()));
  end if;
  return new;
end;
$$;

create trigger propuestas_registrar_evento
after insert or update on public.propuestas
for each row execute function public.registrar_evento_propuesta();

-- ---------------------------------------------------------------------------
-- notas_internas (solo equipo)
-- ---------------------------------------------------------------------------
create table public.notas_internas (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  contenido text not null check (char_length(contenido) between 1 and 5000),
  autor_id uuid references public.perfiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.notas_internas is 'Notas del equipo sobre un cliente. Nunca visibles para el cliente.';

create index notas_internas_cliente_idx on public.notas_internas (cliente_id, created_at desc);

-- ---------------------------------------------------------------------------
-- consentimientos (habeas data)
-- ---------------------------------------------------------------------------
create table public.consentimientos (
  id bigint generated always as identity primary key,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  tipo text not null default 'tratamiento_datos' check (tipo in ('tratamiento_datos')),
  version text not null,
  user_agent text,
  aceptado_at timestamptz not null default now(),
  unique (perfil_id, tipo, version)
);

comment on table public.consentimientos is 'Autorizaciones de tratamiento de datos personales aceptadas por cada usuario.';

-- ---------------------------------------------------------------------------
-- Alta de usuarios
--   * Crea el perfil.
--   * Cuentas OAuth (clientes): vincula el expediente existente con el mismo correo
--     verificado o crea uno nuevo (que abre su propuesta en estado "pendiente").
--   * Cuentas por correo (equipo, por invitación) no generan expediente.
-- ---------------------------------------------------------------------------
create function public.gestionar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nombre text := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', '')
  );
  v_email_verificado boolean := new.email_confirmed_at is not null
    or coalesce(new.raw_user_meta_data ->> 'email_verified' = 'true', false);
  v_cliente public.clientes%rowtype;
begin
  insert into public.perfiles (id, email, nombre_completo, avatar_url)
  values (
    new.id,
    new.email,
    v_nombre,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );

  if coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'email' or new.email is null then
    return new;
  end if;

  select * into v_cliente from public.clientes where lower(email) = lower(new.email);

  if found then
    -- Solo se vincula con un correo verificado; si no, el equipo lo resuelve manualmente.
    if v_cliente.perfil_id is null and v_email_verificado then
      update public.clientes set perfil_id = new.id where id = v_cliente.id;
    end if;
  else
    insert into public.clientes (perfil_id, nombre_completo, email, origen)
    values (new.id, coalesce(v_nombre, split_part(new.email, '@', 1)), new.email, 'registro_web');
  end if;

  return new;
end;
$$;

create trigger al_crear_usuario
after insert on auth.users
for each row execute function public.gestionar_nuevo_usuario();

-- Todo expediente nuevo abre su propuesta en estado "pendiente".
create function public.crear_propuesta_para_cliente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.propuestas (cliente_id)
  values (new.id)
  on conflict (cliente_id) do nothing;
  return new;
end;
$$;

create trigger clientes_crear_propuesta
after insert on public.clientes
for each row execute function public.crear_propuesta_para_cliente();

-- ---------------------------------------------------------------------------
-- Privilegios
-- ---------------------------------------------------------------------------
revoke all on public.perfiles, public.clientes, public.propuestas,
  public.propuesta_eventos, public.notas_internas, public.consentimientos from anon;

-- El usuario solo puede editar datos básicos de su perfil, nunca su rol.
revoke update on public.perfiles from authenticated;
grant update (nombre_completo, avatar_url) on public.perfiles to authenticated;

-- El historial solo lo escribe el trigger.
revoke insert, update, delete on public.propuesta_eventos from authenticated;

revoke execute on function
  public.gestionar_nuevo_usuario(),
  public.crear_propuesta_para_cliente(),
  public.registrar_evento_propuesta()
from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.perfiles enable row level security;
alter table public.clientes enable row level security;
alter table public.propuestas enable row level security;
alter table public.propuesta_eventos enable row level security;
alter table public.notas_internas enable row level security;
alter table public.consentimientos enable row level security;

-- perfiles
create policy "Perfiles: lectura propia o admin"
on public.perfiles for select to authenticated
using (id = (select auth.uid()) or (select public.es_admin()));

create policy "Perfiles: edición propia"
on public.perfiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- clientes
create policy "Clientes: lectura del propio expediente o admin"
on public.clientes for select to authenticated
using (perfil_id = (select auth.uid()) or (select public.es_admin()));

create policy "Clientes: alta por admin"
on public.clientes for insert to authenticated
with check ((select public.es_admin()));

create policy "Clientes: edición por admin"
on public.clientes for update to authenticated
using ((select public.es_admin()))
with check ((select public.es_admin()));

create policy "Clientes: borrado por admin"
on public.clientes for delete to authenticated
using ((select public.es_admin()));

-- propuestas
create policy "Propuestas: lectura de la propia o admin"
on public.propuestas for select to authenticated
using (
  (select public.es_admin())
  or exists (
    select 1 from public.clientes c
    where c.id = propuestas.cliente_id and c.perfil_id = (select auth.uid())
  )
);

create policy "Propuestas: alta por admin"
on public.propuestas for insert to authenticated
with check ((select public.es_admin()));

create policy "Propuestas: edición por admin"
on public.propuestas for update to authenticated
using ((select public.es_admin()))
with check ((select public.es_admin()));

create policy "Propuestas: borrado por admin"
on public.propuestas for delete to authenticated
using ((select public.es_admin()));

-- propuesta_eventos
create policy "Eventos: lectura de la propia propuesta o admin"
on public.propuesta_eventos for select to authenticated
using (
  (select public.es_admin())
  or exists (
    select 1
    from public.propuestas p
    join public.clientes c on c.id = p.cliente_id
    where p.id = propuesta_eventos.propuesta_id and c.perfil_id = (select auth.uid())
  )
);

-- notas_internas
create policy "Notas internas: solo admin"
on public.notas_internas for all to authenticated
using ((select public.es_admin()))
with check ((select public.es_admin()));

-- consentimientos
create policy "Consentimientos: lectura propia o admin"
on public.consentimientos for select to authenticated
using (perfil_id = (select auth.uid()) or (select public.es_admin()));

create policy "Consentimientos: registro propio"
on public.consentimientos for insert to authenticated
with check (perfil_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: documentos de propuestas (bucket privado, solo PDF, máx. 10 MB)
-- Ruta: {cliente_id}/{propuesta_id}/{archivo}.pdf
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('propuestas', 'propuestas', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy "Propuestas (storage): gestión por admin"
on storage.objects for all to authenticated
using (bucket_id = 'propuestas' and (select public.es_admin()))
with check (bucket_id = 'propuestas' and (select public.es_admin()));

create policy "Propuestas (storage): descarga del cliente cuando está finalizada"
on storage.objects for select to authenticated
using (
  bucket_id = 'propuestas'
  and exists (
    select 1
    from public.propuestas p
    join public.clientes c on c.id = p.cliente_id
    where p.documento_path = name
      and p.estado = 'finalizada'
      and c.perfil_id = (select auth.uid())
  )
);
