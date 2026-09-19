import "server-only";

import { siteConfig } from "@/config/site";
import { requerirCliente } from "@/lib/auth/sesion";
import { createClient } from "@/lib/supabase/server";

/**
 * Datos del portal del cliente. Devuelve solo lo que el cliente puede ver (sin rutas internas
 * de documentos ni notas del equipo).
 */
export async function obtenerMiProceso() {
  const usuario = await requerirCliente();
  const supabase = await createClient();

  const [expediente, consentimiento] = await Promise.all([
    supabase
      .from("clientes")
      .select(
        "id, nombre_completo, email, telefono, tipo_documento, numero_documento, ciudad, propuestas(id, estado, mensaje_cliente, documento_path, finalizada_at, updated_at)",
      )
      .eq("perfil_id", usuario.id)
      .maybeSingle(),
    supabase
      .from("consentimientos")
      .select("id")
      .eq("perfil_id", usuario.id)
      .eq("tipo", "tratamiento_datos")
      .eq("version", siteConfig.legal.politicaDatosVersion)
      .maybeSingle(),
  ]);

  if (expediente.error) throw expediente.error;
  if (consentimiento.error) throw consentimiento.error;

  const cliente = expediente.data;
  const propuesta = cliente?.propuestas ?? null;

  const eventos = propuesta
    ? await supabase
        .from("propuesta_eventos")
        .select("id, estado_anterior, estado_nuevo, mensaje, created_at")
        .eq("propuesta_id", propuesta.id)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [], error: null };

  if (eventos.error) throw eventos.error;

  return {
    usuario,
    consentimientoVigente: Boolean(consentimiento.data),
    cliente: cliente
      ? {
          nombre: cliente.nombre_completo,
          email: cliente.email,
          telefono: cliente.telefono,
          documento:
            cliente.tipo_documento && cliente.numero_documento
              ? `${cliente.tipo_documento} •••${cliente.numero_documento.slice(-4)}`
              : null,
          ciudad: cliente.ciudad,
        }
      : null,
    propuesta: propuesta
      ? {
          id: propuesta.id,
          estado: propuesta.estado,
          mensaje: propuesta.mensaje_cliente,
          documentoDisponible:
            propuesta.estado === "finalizada" && Boolean(propuesta.documento_path),
          finalizadaAt: propuesta.finalizada_at,
          actualizadaAt: propuesta.updated_at,
        }
      : null,
    eventos: eventos.data,
  };
}
