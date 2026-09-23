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

const fechaLarga = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: ZONA_HORARIA,
});

/** Fecha con el mes en letras, como en las propuestas: "11 de septiembre de 2026". */
export function formatearFechaLarga(valor: string | Date): string {
  return fechaLarga.format(new Date(valor));
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

const enteroCO = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

/** Pesos colombianos sin decimales, como en las propuestas: "$8.580.000". */
export function formatearPesos(valor: number): string {
  const redondeado = Math.round(valor);
  const signo = redondeado < 0 ? "-" : "";
  return `${signo}$${enteroCO.format(Math.abs(redondeado))}`;
}

/** Fracción como porcentaje: 0.3 -> "30 %". */
export function formatearPorcentaje(fraccion: number, decimales = 0): string {
  return `${new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(fraccion * 100)} %`;
}

export function formatearNumero(valor: number): string {
  return enteroCO.format(valor);
}

const porcentajeCO = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

/** Porcentaje de honorarios tal como se registra (5 -> "5 %", 5.5 -> "5,5 %"). */
export function formatearPorcentajeHonorarios(porcentaje: number): string {
  return `${porcentajeCO.format(porcentaje)} %`;
}
