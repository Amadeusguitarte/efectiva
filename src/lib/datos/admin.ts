import "server-only";

import { requerirAdmin } from "@/lib/auth/sesion";
import {
  ESTADOS_EN_CURSO,
  ESTADOS_PROPUESTA,
  type EstadoPropuesta,
} from "@/lib/propuestas/estados";
import { createClient } from "@/lib/supabase/server";

/**
 * Capa de acceso a datos del panel. Cada función valida que quien consulta sea admin; además,
 * la base de datos aplica RLS.
 */

export const CLIENTES_POR_PAGINA = 20;

export async function obtenerResumen() {
  await requerirAdmin();
  const supabase = await createClient();

  const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [total, propuestas, nuevos, recientes] = await Promise.all([
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    supabase.from("propuestas").select("estado"),
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", hace30Dias),
    supabase
      .from("clientes")
      .select("id, nombre_completo, email, created_at, propuestas(estado, updated_at)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (total.error) throw total.error;
  if (propuestas.error) throw propuestas.error;
  if (nuevos.error) throw nuevos.error;
  if (recientes.error) throw recientes.error;

  const porEstado = Object.fromEntries(ESTADOS_PROPUESTA.map((estado) => [estado, 0])) as Record<
    EstadoPropuesta,
    number
  >;
  for (const { estado } of propuestas.data) porEstado[estado] += 1;

  return {
    totalClientes: total.count ?? 0,
    nuevosUltimos30Dias: nuevos.count ?? 0,
    enCurso: ESTADOS_EN_CURSO.reduce((total, estado) => total + porEstado[estado], 0),
    porEstado,
    recientes: recientes.data,
  };
}

type FiltrosClientes = {
  busqueda?: string;
  estado?: EstadoPropuesta;
  pagina?: number;
};

/** Limpia el texto para usarlo como valor entrecomillado en un filtro `or` de PostgREST. */
function textoBusqueda(valor: string) {
  return valor
    .replace(/[,()*%"\\]/g, " ")
    .trim()
    .slice(0, 80);
}

export async function listarClientes({ busqueda, estado, pagina = 1 }: FiltrosClientes) {
  await requerirAdmin();
  const supabase = await createClient();

  const desde = (pagina - 1) * CLIENTES_POR_PAGINA;
  let consulta = supabase
    .from("clientes")
    .select(
      "id, nombre_completo, email, telefono, ciudad, perfil_id, created_at, propuestas!inner(id, estado, updated_at)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(desde, desde + CLIENTES_POR_PAGINA - 1);

  if (estado) consulta = consulta.eq("propuestas.estado", estado);

  const termino = busqueda ? textoBusqueda(busqueda) : "";
  if (termino) {
    const patron = `"*${termino}*"`;
    consulta = consulta.or(
      ["nombre_completo", "email", "numero_documento", "telefono"]
        .map((columna) => `${columna}.ilike.${patron}`)
        .join(","),
    );
  }

  const { data, count, error } = await consulta;
  if (error) throw error;

  return {
    clientes: data,
    total: count ?? 0,
    paginas: Math.max(1, Math.ceil((count ?? 0) / CLIENTES_POR_PAGINA)),
  };
}

export async function obtenerCliente(id: string) {
  await requerirAdmin();
  const supabase = await createClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select(
      `id, nombre_completo, email, telefono, tipo_documento, numero_documento, ciudad, origen, created_at, updated_at,
       cuenta:perfiles!clientes_perfil_id_fkey(id, email, avatar_url, created_at),
       propuestas(id, estado, mensaje_cliente, documento_path, finalizada_at, updated_at)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!cliente) return null;

  const [eventos, notas] = await Promise.all([
    cliente.propuestas
      ? supabase
          .from("propuesta_eventos")
          .select(
            "id, estado_anterior, estado_nuevo, mensaje, created_at, autor:perfiles(nombre_completo, email)",
          )
          .eq("propuesta_id", cliente.propuestas.id)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("notas_internas")
      .select("id, contenido, created_at, autor:perfiles(nombre_completo, email)")
      .eq("cliente_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (eventos.error) throw eventos.error;
  if (notas.error) throw notas.error;

  return { ...cliente, eventos: eventos.data, notas: notas.data };
}

export type ClienteDetalle = NonNullable<Awaited<ReturnType<typeof obtenerCliente>>>;
