/** Registro sencillo con hora y prefijo; suficiente para los logs de Railway. */
export function crearRegistro(prefijo: string) {
  const linea = (nivel: string, mensaje: string, detalle?: unknown) => {
    const hora = new Date().toISOString();
    const extra =
      detalle instanceof Error
        ? ` ${detalle.message}`
        : detalle !== undefined
          ? ` ${JSON.stringify(detalle)}`
          : "";
    const texto = `${hora} [${prefijo}] ${nivel} ${mensaje}${extra}`;
    if (nivel === "ERROR") console.error(texto);
    else process.stdout.write(`${texto}\n`);
  };
  return {
    info: (mensaje: string, detalle?: unknown) => linea("INFO", mensaje, detalle),
    aviso: (mensaje: string, detalle?: unknown) => linea("AVISO", mensaje, detalle),
    error: (mensaje: string, detalle?: unknown) => linea("ERROR", mensaje, detalle),
  };
}

export type Registro = ReturnType<typeof crearRegistro>;

export const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

export function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
