-- ---------------------------------------------------------------------------
-- Redacción de la propuesta legal
--
-- Textos de los puntos 1 a 4 de la propuesta que el equipo ajusta antes de generar el PDF.
-- Un campo en null significa "usar el borrador automático" que redacta la aplicación a partir
-- de la matriz de diagnóstico. El resto de la propuesta (encabezado, tabla, párrafos fijos,
-- gestión, idoneidad y firma) se construye en la aplicación.
-- ---------------------------------------------------------------------------

create type public.tratamiento_cliente as enum ('senor', 'senora');

create table public.propuesta_redacciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null unique references public.clientes (id) on delete cascade,
  tratamiento public.tratamiento_cliente not null default 'senor',
  situacion_economica text check (char_length(situacion_economica) <= 8000),
  situacion_legal text check (char_length(situacion_legal) <= 8000),
  recomendacion text check (char_length(recomendacion) <= 8000),
  honorarios text check (char_length(honorarios) <= 8000),
  actualizado_por uuid references public.perfiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.propuesta_redacciones is 'Textos de la propuesta legal ajustados por el equipo; null = borrador automático.';
comment on column public.propuesta_redacciones.tratamiento is 'Señor o Señora en el encabezado y la redacción.';

create trigger propuesta_redacciones_set_updated_at
before update on public.propuesta_redacciones
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Privilegios y RLS: solo el equipo
-- ---------------------------------------------------------------------------
revoke all on public.propuesta_redacciones from anon;

alter table public.propuesta_redacciones enable row level security;

create policy "Redacciones: solo el equipo"
on public.propuesta_redacciones for all to authenticated
using ((select public.es_admin()))
with check ((select public.es_admin()));
