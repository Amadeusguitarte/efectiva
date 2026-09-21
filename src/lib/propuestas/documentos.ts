/** Utilidades de los documentos de propuesta (bucket privado "propuestas"). */

export const BUCKET_PROPUESTAS = "propuestas";

export const DOCUMENTO_MAX_BYTES = 10 * 1024 * 1024;

export function rutaDocumentoPropuesta(clienteId: string, propuestaId: string, nombre: string) {
  return `${clienteId}/${propuestaId}/${nombre}`;
}

export function esRutaDocumentoValida(ruta: string, clienteId: string, propuestaId: string) {
  const prefijo = `${clienteId}/${propuestaId}/`;
  return ruta.startsWith(prefijo) && /^[\w-]+\.pdf$/.test(ruta.slice(prefijo.length));
}
