const ZONA_HORARIA = "America/Bogota";

const fechaCorta = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: ZONA_HORARIA,
});

const fechaHora = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: ZONA_HORARIA,
});

export function formatearFecha(valor: string | Date): string {
  return fechaCorta.format(new Date(valor));
}

export function formatearFechaHora(valor: string | Date): string {
  return fechaHora.format(new Date(valor));
}

/** Número para wa.me: solo dígitos, con indicativo 57 si es un celular colombiano de 10 dígitos. */
export function numeroWhatsApp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "");
  return digitos.length === 10 ? `57${digitos}` : digitos;
}

export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? "";
}

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}
