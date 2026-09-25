import { iniciarCorreo } from "./correo";
import { cargarEntorno } from "./entorno";
import { crearRegistro } from "./registro";
import { crearSupabase } from "./supabase";
import { iniciarWhatsApp } from "./whatsapp";

/**
 * Worker del CRM: mantiene la conexión de WhatsApp (QR) y la cuenta de correo, registra lo que
 * llega y envía lo que el equipo escribe desde el panel. Se ejecuta como proceso aparte
 * (`npm run worker` en local; servicio `worker` en Railway).
 */

const log = crearRegistro("worker");

async function main() {
  const entorno = cargarEntorno();
  if (!entorno.claveCifrado) {
    log.aviso("CRM_CLAVE_CIFRADO no está definida: el correo no podrá leer su contraseña.");
  }
  const sb = crearSupabase(entorno);

  const detener: (() => Promise<void>)[] = [];
  detener.push(await iniciarWhatsApp(sb));
  detener.push(await iniciarCorreo(sb, entorno));
  log.info("Worker en marcha");

  let cerrando = false;
  const cerrar = async (senal: string) => {
    if (cerrando) return;
    cerrando = true;
    log.info(`Recibida ${senal}; cerrando`);
    await Promise.all(detener.map((d) => d().catch((e) => log.error("Al detener", e))));
    process.exit(0);
  };
  process.on("SIGTERM", () => void cerrar("SIGTERM"));
  process.on("SIGINT", () => void cerrar("SIGINT"));
}

main().catch((error) => {
  log.error("El worker no pudo arrancar", error);
  process.exit(1);
});
