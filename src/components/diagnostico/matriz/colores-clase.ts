import type { ClaseCredito } from "@/lib/diagnostico/catalogos";

/** Colores del formato condicional de la columna CLASE del Excel (fondos suaves). */
export const FONDO_CLASE: Record<ClaseCredito, string> = {
  primera: "bg-clase-primera",
  segunda: "bg-clase-segunda",
  tercera: "bg-clase-tercera",
  cuarta: "bg-clase-cuarta",
  quinta: "bg-clase-quinta",
  por_verificar: "bg-clase-por-verificar",
};

/** El mismo color de cada clase en su versión intensa, para barras y marcas pequeñas. */
export const COLOR_INTENSO_CLASE: Record<ClaseCredito, string> = {
  primera: "bg-clase-primera-intenso",
  segunda: "bg-clase-segunda-intenso",
  tercera: "bg-clase-tercera-intenso",
  cuarta: "bg-clase-cuarta-intenso",
  quinta: "bg-clase-quinta-intenso",
  por_verificar: "bg-clase-por-verificar-intenso",
};
