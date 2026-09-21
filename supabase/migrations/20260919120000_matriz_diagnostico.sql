-- ============================================================================
-- Matriz de diagnóstico (fase 2)
--
--   diagnosticos   lo que el equipo registra en la reunión de diagnóstico con el cliente
--                  (situación económica, tipo de servicio, honorarios, notas jurídicas).
--                  Uno por cliente.
--   obligaciones   deudas del cliente: una fila por acreedor y producto.
--
-- Los indicadores (pasivo total, elegibilidad, honorarios, centro de conciliación, costo del
-- proceso) NO se guardan: los calcula la aplicación en src/lib/diagnostico a partir de estas
-- tablas, de modo que un cambio de parámetros se refleja en todos los casos.
--
-- Solo el equipo (rol admin) lee y escribe estas tablas. El cliente nunca las ve: solo recibe
-- la propuesta final.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.estado_civil as enum ('soltero', 'casado', 'union_libre', 'divorciado', 'viudo');

create type public.tipo_servicio as enum (
  'liquidacion_patrimonial',
  'acuerdo_pago',
  'acuerdo_pago_bilateral'
);

create type public.mora_obligacion as enum ('al_dia', 'menos_90_dias', 'mas_90_dias');

create type public.tipo_garantia as enum (
  'sin_garantia',
  'garantia_mobiliaria',
  'hipoteca',
  'otra_verificar'
);

create type public.clase_credito as enum (
  'primera',
  'segunda',
  'tercera',
  'cuarta',
  'quinta',
  'por_verificar'
);

-- ---------------------------------------------------------------------------
-- diagnosticos
-- ---------------------------------------------------------------------------
create table public.diagnosticos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null unique references public.clientes (id) on delete cascade,
  ocupacion text check (char_length(ocupacion) <= 200),
  ingresos_mensuales numeric(15, 2) check (ingresos_mensuales >= 0),
  gastos_mensuales numeric(15, 2) check (gastos_mensuales >= 0),
  bienes text check (char_length(bienes) <= 2000),
  estado_civil public.estado_civil,
  tipo_servicio public.tipo_servicio,
  porcentaje_honorarios numeric(5, 2) not null default 5
    check (porcentaje_honorarios >= 0 and porcentaje_honorarios <= 100),
  -- El tope debe coincidir con PARAMETROS_DIAGNOSTICO.honorarios.cuotasMaximas.
  cuotas_honorarios integer not null default 1 check (cuotas_honorarios between 1 and 60),
  requiere_centro_conciliacion boolean not null default false,
  descuento_centro_conciliacion numeric(15, 2) not null default 0
    check (descuento_centro_conciliacion >= 0),
  observaciones_juridicas text check (char_length(observaciones_juridicas) <= 5000),
  situacion_urgencia text check (char_length(situacion_urgencia) <= 5000),
  objetivo_cliente text check (char_length(objetivo_cliente) <= 5000),
  actualizado_por uuid references public.perfiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.diagnosticos is 'Matriz de diagnóstico de cada cliente (datos de entrada; los indicadores se calculan en la aplicación).';
comment on column public.diagnosticos.porcentaje_honorarios is 'Porcentaje sobre el pasivo total (5 = 5 %).';
comment on column public.diagnosticos.descuento_centro_conciliacion is 'Descuento aplicado a la tarifa del centro de conciliación.';

create trigger diagnosticos_set_updated_at
before update on public.diagnosticos
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- obligaciones
-- ---------------------------------------------------------------------------
create table public.obligaciones (
  id uuid primary key default gen_random_uuid(),
  diagnostico_id uuid not null references public.diagnosticos (id) on delete cascade,
  orden smallint not null check (orden between 1 and 200),
  acreedor text not null check (char_length(acreedor) between 1 and 160),
  concepto text check (char_length(concepto) <= 160),
  capital numeric(15, 2) not null default 0 check (capital >= 0),
  intereses numeric(15, 2) not null default 0 check (intereses >= 0),
  mora public.mora_obligacion not null default 'al_dia',
  dias_mora integer check (dias_mora between 0 and 36500),
  descuento_nomina boolean not null default false,
  tipo_garantia public.tipo_garantia not null default 'sin_garantia',
  clase public.clase_credito not null default 'quinta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (diagnostico_id, orden)
);

comment on table public.obligaciones is 'Deudas registradas en la matriz de diagnóstico de un cliente.';
comment on column public.obligaciones.intereses is 'Intereses y otros conceptos; el total adeudado es capital + intereses.';

create trigger obligaciones_set_updated_at
before update on public.obligaciones
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Guardado atómico de la matriz: crea o actualiza el diagnóstico, reemplaza todas sus
-- obligaciones y, si la propuesta seguía "pendiente", la pasa a "en_diagnostico", todo en una
-- sola transacción. La aplicación valida los datos antes con Zod; aquí rigen además las
-- restricciones de las tablas.
--
-- p_actualizado_en: `updated_at` que vio quien edita. Si otra persona guardó después, se
-- rechaza el guardado (error 40001) para no pisar sus cambios.
-- ---------------------------------------------------------------------------
create function public.guardar_diagnostico(
  p_cliente_id uuid,
  p_diagnostico jsonb,
  p_obligaciones jsonb,
  p_actualizado_en timestamptz default null
)
returns table (id uuid, propuesta_en_diagnostico boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_actualizado_en timestamptz;
  v_propuesta boolean := false;
begin
  if not (select public.es_admin()) then
    raise insufficient_privilege using message = 'Solo el equipo puede guardar diagnósticos.';
  end if;
  if jsonb_typeof(p_diagnostico) is distinct from 'object'
     or jsonb_typeof(p_obligaciones) is distinct from 'array' then
    raise exception 'Formato de diagnóstico no válido.';
  end if;

  -- Bloquea la fila (si existe) mientras dura el guardado y comprueba la versión.
  select d.updated_at into v_actualizado_en
  from public.diagnosticos d
  where d.cliente_id = p_cliente_id
  for update;

  if p_actualizado_en is not null and v_actualizado_en is distinct from p_actualizado_en then
    raise exception 'La matriz fue modificada por otra persona. Recarga la página para ver los cambios.'
      using errcode = '40001';
  end if;

  insert into public.diagnosticos as d (
    cliente_id, ocupacion, ingresos_mensuales, gastos_mensuales, bienes, estado_civil,
    tipo_servicio, porcentaje_honorarios, cuotas_honorarios, requiere_centro_conciliacion,
    descuento_centro_conciliacion, observaciones_juridicas, situacion_urgencia,
    objetivo_cliente, actualizado_por
  )
  values (
    p_cliente_id,
    p_diagnostico ->> 'ocupacion',
    (p_diagnostico ->> 'ingresos_mensuales')::numeric,
    (p_diagnostico ->> 'gastos_mensuales')::numeric,
    p_diagnostico ->> 'bienes',
    (p_diagnostico ->> 'estado_civil')::public.estado_civil,
    (p_diagnostico ->> 'tipo_servicio')::public.tipo_servicio,
    coalesce((p_diagnostico ->> 'porcentaje_honorarios')::numeric, 5),
    coalesce((p_diagnostico ->> 'cuotas_honorarios')::integer, 1),
    coalesce((p_diagnostico ->> 'requiere_centro_conciliacion')::boolean, false),
    coalesce((p_diagnostico ->> 'descuento_centro_conciliacion')::numeric, 0),
    p_diagnostico ->> 'observaciones_juridicas',
    p_diagnostico ->> 'situacion_urgencia',
    p_diagnostico ->> 'objetivo_cliente',
    (select auth.uid())
  )
  on conflict (cliente_id) do update set
    ocupacion = excluded.ocupacion,
    ingresos_mensuales = excluded.ingresos_mensuales,
    gastos_mensuales = excluded.gastos_mensuales,
    bienes = excluded.bienes,
    estado_civil = excluded.estado_civil,
    tipo_servicio = excluded.tipo_servicio,
    porcentaje_honorarios = excluded.porcentaje_honorarios,
    cuotas_honorarios = excluded.cuotas_honorarios,
    requiere_centro_conciliacion = excluded.requiere_centro_conciliacion,
    descuento_centro_conciliacion = excluded.descuento_centro_conciliacion,
    observaciones_juridicas = excluded.observaciones_juridicas,
    situacion_urgencia = excluded.situacion_urgencia,
    objetivo_cliente = excluded.objetivo_cliente,
    actualizado_por = excluded.actualizado_por
  returning d.id into v_id;

  delete from public.obligaciones o where o.diagnostico_id = v_id;

  insert into public.obligaciones (
    diagnostico_id, orden, acreedor, concepto, capital, intereses, mora, dias_mora,
    descuento_nomina, tipo_garantia, clase
  )
  select
    v_id,
    o.orden::smallint,
    o.valor ->> 'acreedor',
    o.valor ->> 'concepto',
    coalesce((o.valor ->> 'capital')::numeric, 0),
    coalesce((o.valor ->> 'intereses')::numeric, 0),
    coalesce((o.valor ->> 'mora')::public.mora_obligacion, 'al_dia'),
    (o.valor ->> 'dias_mora')::integer,
    coalesce((o.valor ->> 'descuento_nomina')::boolean, false),
    coalesce((o.valor ->> 'tipo_garantia')::public.tipo_garantia, 'sin_garantia'),
    coalesce((o.valor ->> 'clase')::public.clase_credito, 'quinta')
  from jsonb_array_elements(p_obligaciones) with ordinality as o (valor, orden);

  -- Un caso que todavía estaba "pendiente" pasa a "en diagnóstico" (el cliente lo ve).
  update public.propuestas p
  set estado = 'en_diagnostico'
  where p.cliente_id = p_cliente_id and p.estado = 'pendiente';
  v_propuesta := found;

  return query select v_id, v_propuesta;
end;
$$;

comment on function public.guardar_diagnostico(uuid, jsonb, jsonb, timestamptz) is
  'Crea o actualiza la matriz de diagnóstico de un cliente, reemplaza sus obligaciones y pasa la propuesta pendiente a en_diagnostico (atómico, solo admin, con control de versión).';

-- ---------------------------------------------------------------------------
-- Privilegios y RLS
-- ---------------------------------------------------------------------------
revoke all on public.diagnosticos, public.obligaciones from anon;

revoke execute on function public.guardar_diagnostico(uuid, jsonb, jsonb, timestamptz) from public, anon;
grant execute on function public.guardar_diagnostico(uuid, jsonb, jsonb, timestamptz) to authenticated;

alter table public.diagnosticos enable row level security;
alter table public.obligaciones enable row level security;

create policy "Diagnósticos: solo el equipo"
on public.diagnosticos for all to authenticated
using ((select public.es_admin()))
with check ((select public.es_admin()));

create policy "Obligaciones: solo el equipo"
on public.obligaciones for all to authenticated
using ((select public.es_admin()))
with check ((select public.es_admin()));
