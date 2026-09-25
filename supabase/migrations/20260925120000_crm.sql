-- ---------------------------------------------------------------------------
-- CRM propio: pipeline por etapas, casos, mensajes de WhatsApp y correo,
-- tareas, historial, notificaciones, ajustes y cuentas de WhatsApp.
--
-- El equipo (rol admin) gestiona todo desde el panel. El proceso "worker"
-- (WhatsApp y correo) usa la clave secreta de Supabase y es el único que toca
-- `wa_auth`; la aplicación web nunca la usa.
-- ---------------------------------------------------------------------------

create type public.crm_canal as enum ('whatsapp', 'correo');
create type public.crm_direccion as enum ('entrada', 'salida');
create type public.crm_estado_envio as enum ('pendiente', 'enviado', 'fallido');
create type public.crm_tipo_tarea as enum ('documentos', 'recontacto', 'seguimiento', 'otra');
create type public.crm_estado_tarea as enum ('pendiente', 'completada', 'cancelada');
create type public.crm_tipo_evento as enum (
  'creacion',
  'etapa',
  'responsable',
  'proxima_accion',
  'nota',
  'tarea_creada',
  'tarea_completada',
  'correo_automatico',
  'analisis_ia',
  'expediente',
  'datos'
);
create type public.crm_cierre as enum ('ganado', 'perdido');
create type public.wa_estado as enum ('desconectado', 'qr', 'conectando', 'conectado', 'error');

-- Solo dígitos (indicativo incluido) o null si no parece un teléfono.
create function public.crm_normalizar_telefono(p_valor text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when regexp_replace(coalesce(p_valor, ''), '[^0-9]', '', 'g') ~ '^[0-9]{7,15}$'
      then regexp_replace(p_valor, '[^0-9]', '', 'g')
    else null
  end;
$$;

-- ---------------------------------------------------------------------------
-- Etapas del pipeline
-- ---------------------------------------------------------------------------
create table public.crm_etapas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 60),
  orden integer not null,
  color text not null default '#2563eb' check (color ~ '^#[0-9a-fA-F]{6}$'),
  descripcion text check (char_length(descripcion) <= 500),
  -- Etapas de cierre: el caso termina ganado (cliente) o perdido.
  cierre public.crm_cierre,
  -- [{tipo, titulo, descripcion, dias_plazo}] que se crean al entrar a la etapa.
  tareas_automaticas jsonb not null default '[]'::jsonb
    check (jsonb_typeof(tareas_automaticas) = 'array'),
  -- {asunto, cuerpo} que se envía al correo del caso al entrar a la etapa.
  correo_automatico jsonb
    check (correo_automatico is null or jsonb_typeof(correo_automatico) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.crm_etapas is 'Etapas del pipeline del CRM, con sus tareas y correo automáticos.';

create trigger crm_etapas_set_updated_at
before update on public.crm_etapas
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Casos (cada contacto por WhatsApp o correo es un caso del pipeline)
-- ---------------------------------------------------------------------------
create table public.crm_casos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 160),
  telefono text check (telefono ~ '^[0-9]{7,15}$'),
  email text check (position('@' in email) > 1 and char_length(email) <= 254),
  etapa_id uuid not null references public.crm_etapas (id) on delete restrict,
  responsable_id uuid references public.perfiles (id) on delete set null,
  cliente_id uuid references public.clientes (id) on delete set null,
  proxima_accion text check (char_length(proxima_accion) <= 500),
  proxima_accion_fecha date,
  origen public.crm_canal,
  analisis jsonb check (analisis is null or jsonb_typeof(analisis) = 'object'),
  ultimo_mensaje_at timestamptz,
  ultimo_mensaje_direccion public.crm_direccion,
  creado_por uuid references public.perfiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.crm_casos is 'Casos del CRM: un contacto con su etapa, responsable, próxima acción y análisis de IA.';
comment on column public.crm_casos.telefono is 'Solo dígitos con indicativo (573001234567).';
comment on column public.crm_casos.origen is 'Canal por el que llegó; null si lo creó el equipo.';

create unique index crm_casos_telefono_key on public.crm_casos (telefono) where telefono is not null;
create unique index crm_casos_email_key on public.crm_casos (lower(email)) where email is not null;
create index crm_casos_etapa_idx on public.crm_casos (etapa_id);
create index crm_casos_responsable_idx on public.crm_casos (responsable_id);
create index crm_casos_ultimo_mensaje_idx on public.crm_casos (ultimo_mensaje_at desc nulls last);

create trigger crm_casos_set_updated_at
before update on public.crm_casos
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Mensajes (hilo de WhatsApp y de correo de cada caso; los de salida
-- pendientes son la cola que envía el worker)
-- ---------------------------------------------------------------------------
create table public.crm_mensajes (
  id bigint generated always as identity primary key,
  caso_id uuid not null references public.crm_casos (id) on delete cascade,
  canal public.crm_canal not null,
  direccion public.crm_direccion not null,
  asunto text check (char_length(asunto) <= 300),
  contenido text not null check (char_length(contenido) <= 20000),
  -- Id del mensaje en WhatsApp o Message-ID del correo; evita duplicados.
  id_externo text,
  autor_id uuid references public.perfiles (id) on delete set null,
  estado_envio public.crm_estado_envio not null default 'enviado',
  error text,
  enviado_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.crm_mensajes is 'Mensajes de cada caso. Los de salida en estado pendiente los envía el worker.';

create unique index crm_mensajes_externo_key on public.crm_mensajes (canal, id_externo)
  where id_externo is not null;
create index crm_mensajes_caso_idx on public.crm_mensajes (caso_id, id);
create index crm_mensajes_pendientes_idx on public.crm_mensajes (canal, id)
  where direccion = 'salida' and estado_envio = 'pendiente';

-- ---------------------------------------------------------------------------
-- Tareas
-- ---------------------------------------------------------------------------
create table public.crm_tareas (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references public.crm_casos (id) on delete cascade,
  tipo public.crm_tipo_tarea not null default 'otra',
  titulo text not null check (char_length(titulo) between 1 and 200),
  descripcion text check (char_length(descripcion) <= 2000),
  vence_at date,
  responsable_id uuid references public.perfiles (id) on delete set null,
  estado public.crm_estado_tarea not null default 'pendiente',
  origen_etapa_id uuid references public.crm_etapas (id) on delete set null,
  creada_por uuid references public.perfiles (id) on delete set null,
  completada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_tareas_caso_idx on public.crm_tareas (caso_id, created_at desc);
create index crm_tareas_pendientes_idx on public.crm_tareas (vence_at) where estado = 'pendiente';

create trigger crm_tareas_set_updated_at
before update on public.crm_tareas
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Historial del caso
-- ---------------------------------------------------------------------------
create table public.crm_eventos (
  id bigint generated always as identity primary key,
  caso_id uuid not null references public.crm_casos (id) on delete cascade,
  tipo public.crm_tipo_evento not null,
  descripcion text not null check (char_length(descripcion) <= 5000),
  datos jsonb,
  autor_id uuid references public.perfiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index crm_eventos_caso_idx on public.crm_eventos (caso_id, id desc);

-- ---------------------------------------------------------------------------
-- Notificaciones del equipo
-- ---------------------------------------------------------------------------
create table public.crm_notificaciones (
  id bigint generated always as identity primary key,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  titulo text not null check (char_length(titulo) <= 200),
  cuerpo text check (char_length(cuerpo) <= 1000),
  enlace text check (char_length(enlace) <= 300),
  caso_id uuid references public.crm_casos (id) on delete cascade,
  leida_at timestamptz,
  created_at timestamptz not null default now()
);

create index crm_notificaciones_perfil_idx on public.crm_notificaciones (perfil_id, id desc);

-- ---------------------------------------------------------------------------
-- Ajustes (IA, correo, WhatsApp). `secreto` va cifrado por la aplicación.
-- ---------------------------------------------------------------------------
create table public.crm_ajustes (
  clave text primary key check (clave in ('ia', 'correo', 'whatsapp')),
  valor jsonb not null default '{}'::jsonb check (jsonb_typeof(valor) = 'object'),
  secreto text,
  actualizado_por uuid references public.perfiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on column public.crm_ajustes.secreto is 'Clave de API o contraseña, cifrada con CRM_CLAVE_CIFRADO (AES-256-GCM).';

insert into public.crm_ajustes (clave) values ('ia'), ('correo'), ('whatsapp');

-- ---------------------------------------------------------------------------
-- WhatsApp: cuenta vinculada por QR y su sesión (solo el worker)
-- ---------------------------------------------------------------------------
create table public.wa_cuentas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null default 'Principal' check (char_length(nombre) <= 60),
  estado public.wa_estado not null default 'desconectado',
  qr text,
  telefono text,
  ultimo_error text,
  -- Señales del panel al worker.
  reinicio_solicitado boolean not null default false,
  cierre_solicitado boolean not null default false,
  conectado_at timestamptz,
  -- Latido del worker; si es viejo, el worker no está corriendo.
  visto_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wa_cuentas_set_updated_at
before update on public.wa_cuentas
for each row execute function public.set_updated_at();

insert into public.wa_cuentas (nombre) values ('Principal');

create table public.wa_auth (
  cuenta_id uuid not null references public.wa_cuentas (id) on delete cascade,
  clave text not null,
  valor jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (cuenta_id, clave)
);

comment on table public.wa_auth is 'Credenciales de sesión de Baileys. Sin acceso para usuarios: solo el worker.';

-- ---------------------------------------------------------------------------
-- Funciones
-- ---------------------------------------------------------------------------

-- Notifica al responsable del caso o, si no tiene, a todo el equipo (menos a p_excluir).
create function public.crm_notificar_caso(
  p_caso_id uuid,
  p_titulo text,
  p_cuerpo text,
  p_excluir uuid default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_caso public.crm_casos%rowtype;
  v_perfil uuid;
  v_enlace text;
begin
  select * into v_caso from public.crm_casos where id = p_caso_id;
  if not found then
    return;
  end if;
  v_enlace := '/admin/crm/casos/' || v_caso.id;

  if v_caso.responsable_id is not null then
    if v_caso.responsable_id is distinct from p_excluir then
      insert into public.crm_notificaciones (perfil_id, titulo, cuerpo, enlace, caso_id)
      values (v_caso.responsable_id, p_titulo, p_cuerpo, v_enlace, v_caso.id);
    end if;
    return;
  end if;

  for v_perfil in
    select id from public.perfiles where rol = 'admin' and id is distinct from p_excluir
  loop
    insert into public.crm_notificaciones (perfil_id, titulo, cuerpo, enlace, caso_id)
    values (v_perfil, p_titulo, p_cuerpo, v_enlace, v_caso.id);
  end loop;
end;
$$;

-- Mueve un caso de etapa y dispara lo que la etapa tenga configurado:
-- tareas automáticas (con notificación) y correo automático (en cola).
create function public.crm_mover_etapa(
  p_caso_id uuid,
  p_etapa_id uuid,
  p_autor uuid default null,
  p_motivo text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_caso public.crm_casos%rowtype;
  v_anterior public.crm_etapas%rowtype;
  v_nueva public.crm_etapas%rowtype;
  v_tarea jsonb;
  v_tarea_id uuid;
  v_tipo public.crm_tipo_tarea;
  v_titulo text;
  v_dias integer;
  v_asunto text;
  v_cuerpo text;
begin
  select * into v_caso from public.crm_casos where id = p_caso_id for update;
  if not found then
    raise exception 'Caso no encontrado' using errcode = 'P0002';
  end if;
  select * into v_nueva from public.crm_etapas where id = p_etapa_id;
  if not found then
    raise exception 'Etapa no encontrada' using errcode = 'P0002';
  end if;
  if v_caso.etapa_id = p_etapa_id then
    return;
  end if;
  select * into v_anterior from public.crm_etapas where id = v_caso.etapa_id;

  update public.crm_casos set etapa_id = p_etapa_id where id = p_caso_id;

  insert into public.crm_eventos (caso_id, tipo, descripcion, datos, autor_id)
  values (
    p_caso_id,
    'etapa',
    format('Pasó de «%s» a «%s»', v_anterior.nombre, v_nueva.nombre)
      || coalesce('. ' || nullif(trim(p_motivo), ''), ''),
    jsonb_build_object('de', v_anterior.id, 'a', v_nueva.id, 'motivo', p_motivo),
    p_autor
  );

  for v_tarea in select * from jsonb_array_elements(v_nueva.tareas_automaticas) loop
    v_titulo := coalesce(nullif(trim(v_tarea ->> 'titulo'), ''), 'Tarea');
    v_tipo := case
      when (v_tarea ->> 'tipo') in ('documentos', 'recontacto', 'seguimiento', 'otra')
        then (v_tarea ->> 'tipo')::public.crm_tipo_tarea
      else 'otra'
    end;
    v_dias := case
      when (v_tarea ->> 'dias_plazo') ~ '^[0-9]{1,3}$' then (v_tarea ->> 'dias_plazo')::integer
      else 0
    end;

    insert into public.crm_tareas (
      caso_id, tipo, titulo, descripcion, vence_at, responsable_id, origen_etapa_id, creada_por
    )
    values (
      p_caso_id,
      v_tipo,
      left(v_titulo, 200),
      nullif(left(v_tarea ->> 'descripcion', 2000), ''),
      (now() at time zone 'America/Bogota')::date + v_dias,
      v_caso.responsable_id,
      v_nueva.id,
      p_autor
    )
    returning id into v_tarea_id;

    insert into public.crm_eventos (caso_id, tipo, descripcion, datos, autor_id)
    values (
      p_caso_id,
      'tarea_creada',
      format('Tarea creada por la etapa «%s»: %s', v_nueva.nombre, v_titulo),
      jsonb_build_object('tarea_id', v_tarea_id),
      p_autor
    );

    perform public.crm_notificar_caso(
      p_caso_id,
      'Nueva tarea: ' || v_titulo,
      format('%s · etapa «%s»', v_caso.nombre, v_nueva.nombre),
      p_autor
    );
  end loop;

  if v_nueva.correo_automatico is not null
     and v_caso.email is not null
     and coalesce(nullif(trim(v_nueva.correo_automatico ->> 'asunto'), ''), '') <> '' then
    v_asunto := replace(replace(v_nueva.correo_automatico ->> 'asunto', '{{nombre}}', v_caso.nombre),
      '{{etapa}}', v_nueva.nombre);
    v_cuerpo := replace(replace(coalesce(v_nueva.correo_automatico ->> 'cuerpo', ''), '{{nombre}}', v_caso.nombre),
      '{{etapa}}', v_nueva.nombre);

    insert into public.crm_mensajes (caso_id, canal, direccion, asunto, contenido, autor_id, estado_envio)
    values (p_caso_id, 'correo', 'salida', left(v_asunto, 300), left(v_cuerpo, 20000), p_autor, 'pendiente');

    insert into public.crm_eventos (caso_id, tipo, descripcion, autor_id)
    values (p_caso_id, 'correo_automatico', format('Correo automático en cola: «%s»', v_asunto), p_autor);
  end if;
end;
$$;

-- Registra un mensaje entrante (WhatsApp o correo): crea el caso si no existe
-- (vinculándolo a un expediente con el mismo teléfono o correo), guarda el
-- mensaje evitando duplicados y avisa al responsable.
create function public.crm_registrar_entrante(
  p_canal public.crm_canal,
  p_identificador text,
  p_nombre text,
  p_contenido text,
  p_id_externo text default null,
  p_asunto text default null,
  p_fecha timestamptz default null
)
returns table (caso_id uuid, mensaje_id bigint, caso_nuevo boolean, mensaje_nuevo boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ident text;
  v_caso public.crm_casos%rowtype;
  v_cliente public.clientes%rowtype;
  v_etapa uuid;
  v_msg bigint;
  v_caso_existente uuid;
  v_nuevo boolean := false;
  v_email text;
  v_telefono text;
begin
  if p_canal = 'whatsapp' then
    v_ident := public.crm_normalizar_telefono(p_identificador);
  else
    v_ident := nullif(lower(trim(p_identificador)), '');
    if v_ident is not null and position('@' in v_ident) <= 1 then
      v_ident := null;
    end if;
  end if;
  if v_ident is null then
    raise exception 'Identificador no válido' using errcode = '22023';
  end if;

  if p_id_externo is not null then
    select m.caso_id, m.id into v_caso_existente, v_msg
    from public.crm_mensajes m
    where m.canal = p_canal and m.id_externo = p_id_externo;
    if found then
      return query select v_caso_existente, v_msg, false, false;
      return;
    end if;
  end if;

  if p_canal = 'whatsapp' then
    select * into v_caso from public.crm_casos c where c.telefono = v_ident;
  else
    select * into v_caso from public.crm_casos c where lower(c.email) = v_ident;
  end if;

  if not found then
    select e.id into v_etapa from public.crm_etapas e order by e.orden, e.created_at limit 1;
    if v_etapa is null then
      raise exception 'No hay etapas configuradas en el CRM' using errcode = 'P0001';
    end if;

    if p_canal = 'whatsapp' then
      select * into v_cliente from public.clientes cl
      where public.crm_normalizar_telefono(cl.telefono) in (v_ident, '57' || v_ident, substring(v_ident from 3))
      limit 1;
    else
      select * into v_cliente from public.clientes cl where lower(cl.email) = v_ident limit 1;
    end if;

    v_email := case when p_canal = 'correo' then v_ident else lower(v_cliente.email) end;
    if v_email is not null and exists (select 1 from public.crm_casos c where lower(c.email) = v_email) then
      v_email := null;
    end if;
    v_telefono := case
      when p_canal = 'whatsapp' then v_ident
      else public.crm_normalizar_telefono(v_cliente.telefono)
    end;
    if v_telefono is not null and p_canal = 'correo'
       and exists (select 1 from public.crm_casos c where c.telefono = v_telefono) then
      v_telefono := null;
    end if;

    insert into public.crm_casos (nombre, telefono, email, etapa_id, cliente_id, origen)
    values (
      left(coalesce(nullif(trim(p_nombre), ''), v_cliente.nombre_completo, v_ident), 160),
      v_telefono,
      v_email,
      v_etapa,
      v_cliente.id,
      p_canal
    )
    returning * into v_caso;
    v_nuevo := true;

    insert into public.crm_eventos (caso_id, tipo, descripcion)
    values (
      v_caso.id,
      'creacion',
      case when p_canal = 'whatsapp' then 'Caso creado desde WhatsApp' else 'Caso creado desde correo' end
        || case when v_cliente.id is not null then ' y vinculado al expediente existente' else '' end
    );
  end if;

  insert into public.crm_mensajes (caso_id, canal, direccion, asunto, contenido, id_externo, estado_envio, enviado_at)
  values (
    v_caso.id, p_canal, 'entrada', left(p_asunto, 300), left(coalesce(p_contenido, ''), 20000),
    p_id_externo, 'enviado', coalesce(p_fecha, now())
  )
  returning id into v_msg;

  update public.crm_casos
  set ultimo_mensaje_at = greatest(coalesce(ultimo_mensaje_at, '-infinity'::timestamptz), coalesce(p_fecha, now())),
      ultimo_mensaje_direccion = 'entrada'
  where id = v_caso.id;

  perform public.crm_notificar_caso(
    v_caso.id,
    case when p_canal = 'whatsapp' then 'Nuevo WhatsApp de ' else 'Nuevo correo de ' end || v_caso.nombre,
    left(coalesce(p_asunto || ': ', '') || coalesce(p_contenido, ''), 200),
    null
  );

  return query select v_caso.id, v_msg, v_nuevo, true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Etapas iniciales (editables desde Configuración)
-- ---------------------------------------------------------------------------
insert into public.crm_etapas (nombre, orden, color, descripcion, tareas_automaticas, correo_automatico, cierre) values
  ('Nuevo', 1, '#2563eb', 'Acaba de escribir o se registró; nadie lo ha atendido todavía.',
    '[{"tipo":"recontacto","titulo":"Responder el primer contacto","dias_plazo":1}]'::jsonb, null, null),
  ('Contactado', 2, '#0ea5e9', 'Ya hubo una primera conversación con la persona.',
    '[{"tipo":"seguimiento","titulo":"Agendar la reunión de diagnóstico","dias_plazo":2}]'::jsonb, null, null),
  ('Documentos solicitados', 3, '#f59e0b', 'Se le pidieron los documentos para el diagnóstico.',
    '[{"tipo":"documentos","titulo":"Revisar los documentos recibidos","descripcion":"Cédula, extractos y certificaciones de cada deuda, soporte de ingresos y relación de bienes.","dias_plazo":3},{"tipo":"recontacto","titulo":"Recordar el envío de documentos si no han llegado","dias_plazo":5}]'::jsonb,
    '{"asunto":"Documentos para su proceso de insolvencia","cuerpo":"Hola {{nombre}},\n\nGracias por contactar a Insolvencia Efectiva. Para avanzar con su diagnóstico necesitamos los siguientes documentos:\n\n1. Copia de la cédula de ciudadanía.\n2. Extractos o certificaciones actualizadas de cada una de sus deudas.\n3. Soporte de ingresos (certificación laboral, desprendibles de nómina o declaración de renta).\n4. Relación de sus bienes (inmuebles, vehículos, ahorros) con sus soportes.\n\nPuede responder a este correo adjuntándolos. Quedamos atentos.\n\nEquipo Insolvencia Efectiva"}'::jsonb,
    null),
  ('En diagnóstico', 4, '#8b5cf6', 'Se está registrando la matriz de diagnóstico.',
    '[{"tipo":"seguimiento","titulo":"Registrar la matriz de diagnóstico","dias_plazo":2}]'::jsonb, null, null),
  ('Propuesta enviada', 5, '#14b8a6', 'La propuesta legal ya fue enviada; en espera de respuesta.',
    '[{"tipo":"seguimiento","titulo":"Hacer seguimiento a la propuesta enviada","dias_plazo":3}]'::jsonb, null, null),
  ('Cliente', 6, '#16a34a', 'Aceptó la propuesta e inició el proceso.', '[]'::jsonb, null, 'ganado'),
  ('Descartado', 7, '#64748b', 'No continúa por ahora.', '[]'::jsonb, null, 'perdido');

-- ---------------------------------------------------------------------------
-- Privilegios y RLS
-- ---------------------------------------------------------------------------
revoke all on public.crm_etapas, public.crm_casos, public.crm_mensajes, public.crm_tareas,
  public.crm_eventos, public.crm_notificaciones, public.crm_ajustes, public.wa_cuentas, public.wa_auth
  from anon;
-- La sesión de WhatsApp es solo del worker (clave secreta, sin RLS).
revoke all on public.wa_auth from authenticated;

revoke execute on function public.crm_notificar_caso(uuid, text, text, uuid) from public, anon;
revoke execute on function public.crm_mover_etapa(uuid, uuid, uuid, text) from public, anon;
revoke execute on function public.crm_registrar_entrante(public.crm_canal, text, text, text, text, text, timestamptz)
  from public, anon;
grant execute on function public.crm_notificar_caso(uuid, text, text, uuid) to authenticated;
grant execute on function public.crm_mover_etapa(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.crm_registrar_entrante(public.crm_canal, text, text, text, text, text, timestamptz)
  to authenticated;

alter table public.crm_etapas enable row level security;
alter table public.crm_casos enable row level security;
alter table public.crm_mensajes enable row level security;
alter table public.crm_tareas enable row level security;
alter table public.crm_eventos enable row level security;
alter table public.crm_notificaciones enable row level security;
alter table public.crm_ajustes enable row level security;
alter table public.wa_cuentas enable row level security;
alter table public.wa_auth enable row level security;

create policy "CRM etapas: solo el equipo"
on public.crm_etapas for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

create policy "CRM casos: solo el equipo"
on public.crm_casos for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

create policy "CRM mensajes: solo el equipo"
on public.crm_mensajes for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

create policy "CRM tareas: solo el equipo"
on public.crm_tareas for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

create policy "CRM eventos: solo el equipo"
on public.crm_eventos for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

-- Cada miembro ve y marca sus notificaciones; cualquier admin puede crearlas (funciones).
create policy "CRM notificaciones: propias del equipo"
on public.crm_notificaciones for all to authenticated
using (perfil_id = (select auth.uid()) and (select public.es_admin()))
with check ((select public.es_admin()));

create policy "CRM ajustes: solo el equipo"
on public.crm_ajustes for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

create policy "WhatsApp cuentas: solo el equipo"
on public.wa_cuentas for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));
