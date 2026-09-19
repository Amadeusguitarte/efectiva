import type { Enums } from "@/types/database";

/**
 * Catálogos de la matriz de diagnóstico. Equivalen a la hoja "Listas" y a la guía de
 * prelación de créditos ("Guía 5 Clases") del Excel original.
 *
 * `etiqueta` se usa en el panel; `etiquetaPropuesta` es el texto exacto que espera el prompt de
 * la propuesta (por ejemplo "TERCERA", "> 90 días", "Sin garantía").
 */

export type EstadoCivil = Enums<"estado_civil">;
export type TipoServicio = Enums<"tipo_servicio">;
export type MoraObligacion = Enums<"mora_obligacion">;
export type TipoGarantia = Enums<"tipo_garantia">;
export type ClaseCredito = Enums<"clase_credito">;

type Opcion<T extends string> = { valor: T; etiqueta: string; etiquetaPropuesta: string };

export const ESTADOS_CIVILES = [
  { valor: "soltero", etiqueta: "Soltero/a", etiquetaPropuesta: "Soltero/a" },
  { valor: "casado", etiqueta: "Casado/a", etiquetaPropuesta: "Casado/a" },
  { valor: "union_libre", etiqueta: "Unión libre", etiquetaPropuesta: "Unión libre" },
  { valor: "divorciado", etiqueta: "Divorciado/a", etiquetaPropuesta: "Divorciado/a" },
  { valor: "viudo", etiqueta: "Viudo/a", etiquetaPropuesta: "Viudo/a" },
] as const satisfies readonly Opcion<EstadoCivil>[];

export const TIPOS_SERVICIO = [
  {
    valor: "liquidacion_patrimonial",
    etiqueta: "Liquidación patrimonial",
    etiquetaPropuesta: "Liquidacion Patrimonial",
    descripcion:
      "Los bienes que correspondan se destinan al pago de los acreedores y el saldo insoluto se extingue conforme a la ley. Puede tramitarse por centro de conciliación o por la justicia ordinaria.",
  },
  {
    valor: "acuerdo_pago",
    etiqueta: "Acuerdo de pago",
    etiquetaPropuesta: "Acuerdo de Pago",
    descripcion:
      "Negociación con todos los acreedores a través de un centro de conciliación (obligatorio).",
  },
  {
    valor: "acuerdo_pago_bilateral",
    etiqueta: "Acuerdo de pago bilateral",
    etiquetaPropuesta: "Acuerdo de Pago Bilateral",
    descripcion:
      "Denominación interna: el cliente conserva el bien con garantía real (hipoteca o prenda) y sigue pagando esa obligación, mientras las deudas sin garantía se liquidan en el proceso. Nunca se menciona así al cliente.",
  },
] as const satisfies readonly (Opcion<TipoServicio> & { descripcion: string })[];

export const MORAS = [
  { valor: "al_dia", etiqueta: "Al día", etiquetaPropuesta: "Al día" },
  { valor: "menos_90_dias", etiqueta: "Menos de 90 días", etiquetaPropuesta: "< 90 días" },
  { valor: "mas_90_dias", etiqueta: "Más de 90 días", etiquetaPropuesta: "> 90 días" },
] as const satisfies readonly Opcion<MoraObligacion>[];

export const TIPOS_GARANTIA = [
  { valor: "sin_garantia", etiqueta: "Sin garantía", etiquetaPropuesta: "Sin garantía" },
  {
    valor: "garantia_mobiliaria",
    etiqueta: "Garantía mobiliaria / prenda",
    etiquetaPropuesta: "Garantía mobiliaria / prenda",
  },
  { valor: "hipoteca", etiqueta: "Hipoteca", etiquetaPropuesta: "Hipoteca" },
  { valor: "otra_verificar", etiqueta: "Otra / verificar", etiquetaPropuesta: "Otra / verificar" },
] as const satisfies readonly Opcion<TipoGarantia>[];

/** Guía de prelación de créditos (Código Civil arts. 2495 a 2510 y Ley 2445 de 2025). */
export const CLASES = [
  {
    valor: "primera",
    etiqueta: "Primera",
    etiquetaPropuesta: "PRIMERA",
    incluye: "Créditos de primera clase y los que normas especiales equiparan a ella.",
    ejemplos:
      "Laborales; ciertos créditos de seguridad social; impuestos; alimentos de menores con prevalencia constitucional.",
    clave:
      "Identificar la causa legal exacta. No depende de que el acreedor sea banco, persona o entidad pública.",
    baseLegal: "C.C. 2495-2496 y normas especiales",
    tratamiento: "Preferencia general.",
  },
  {
    valor: "segunda",
    etiqueta: "Segunda",
    etiquetaPropuesta: "SEGUNDA",
    incluye:
      "Créditos con preferencia sobre determinados bienes muebles; acreedor prendario o con garantía mobiliaria.",
    ejemplos:
      "Vehículo con prenda; garantía mobiliaria válida. La Ley 2445 incluye el supuesto de fondos de empleados sobre aportes y ahorros.",
    clave:
      "Verificar documento, registro, bien afectado y monto cubierto. El déficit puede terminar en quinta.",
    baseLegal: "C.C. 2497-2498; Ley 2445/2025 art. 10; Ley 1676/2013",
    tratamiento: "Preferencia especial sobre bien mueble.",
  },
  {
    valor: "tercera",
    etiqueta: "Tercera",
    etiquetaPropuesta: "TERCERA",
    incluye: "Créditos hipotecarios.",
    ejemplos: "Crédito garantizado con hipoteca sobre casa, apartamento, lote u otro inmueble.",
    clave:
      "Revisar certificado de tradición, acreedor, grado y fecha de inscripción y saldo garantizado.",
    baseLegal: "C.C. 2499-2501",
    tratamiento: "Preferencia especial sobre inmueble.",
  },
  {
    valor: "cuarta",
    etiqueta: "Cuarta",
    etiquetaPropuesta: "CUARTA",
    incluye:
      "Supuestos taxativos del art. 2502, incluidos ciertos créditos por administración de bienes ajenos y proveedores de materias primas o insumos.",
    ejemplos: "Pupilo contra tutor o curador; proveedor de insumos en el supuesto legal.",
    clave: "No usar como categoría residual. Debe encajar expresamente en el supuesto legal.",
    baseLegal: "C.C. 2502-2506",
    tratamiento: "Privilegio general posterior a las clases 1 a 3.",
  },
  {
    valor: "quinta",
    etiqueta: "Quinta",
    etiquetaPropuesta: "QUINTA",
    incluye: "Créditos sin preferencia legal (quirografarios).",
    ejemplos:
      "Libre inversión sin garantía; tarjeta; préstamo personal; letra sin garantía real; saldo no cubierto por garantía.",
    clave:
      "Si no hay causa legal de preferencia ni garantía real aplicable, normalmente se clasifica aquí.",
    baseLegal: "C.C. 2509-2510",
    tratamiento: "A prorrata con el remanente.",
  },
  {
    valor: "por_verificar",
    etiqueta: "Por verificar",
    etiquetaPropuesta: "POR VERIFICAR",
    incluye: "Pendiente de clasificar con los documentos del cliente.",
    ejemplos: "",
    clave: "Resolver antes de generar la propuesta.",
    baseLegal: "",
    tratamiento: "",
  },
] as const satisfies readonly (Opcion<ClaseCredito> & {
  incluye: string;
  ejemplos: string;
  clave: string;
  baseLegal: string;
  tratamiento: string;
})[];

export const VALORES_ESTADO_CIVIL = ESTADOS_CIVILES.map((o) => o.valor);
export const VALORES_TIPO_SERVICIO = TIPOS_SERVICIO.map((o) => o.valor);
export const VALORES_MORA = MORAS.map((o) => o.valor);
export const VALORES_TIPO_GARANTIA = TIPOS_GARANTIA.map((o) => o.valor);
export const VALORES_CLASE = CLASES.map((o) => o.valor);

function indexar<T extends string, O extends Opcion<T>>(opciones: readonly O[]) {
  return Object.fromEntries(opciones.map((o) => [o.valor, o])) as Record<T, O>;
}

export const INFO_ESTADO_CIVIL = indexar<EstadoCivil, (typeof ESTADOS_CIVILES)[number]>(
  ESTADOS_CIVILES,
);
export const INFO_TIPO_SERVICIO = indexar<TipoServicio, (typeof TIPOS_SERVICIO)[number]>(
  TIPOS_SERVICIO,
);
export const INFO_MORA = indexar<MoraObligacion, (typeof MORAS)[number]>(MORAS);
export const INFO_TIPO_GARANTIA = indexar<TipoGarantia, (typeof TIPOS_GARANTIA)[number]>(
  TIPOS_GARANTIA,
);
export const INFO_CLASE = indexar<ClaseCredito, (typeof CLASES)[number]>(CLASES);

/** Clase que normalmente corresponde a cada garantía real; sirve para avisar incoherencias. */
export const CLASE_ESPERADA_POR_GARANTIA: Partial<Record<TipoGarantia, ClaseCredito>> = {
  hipoteca: "tercera",
  garantia_mobiliaria: "segunda",
};

/** Servicios que exigen centro de conciliación aunque el formulario diga lo contrario. */
export const SERVICIOS_CON_CENTRO_OBLIGATORIO: readonly TipoServicio[] = [
  "acuerdo_pago",
  "acuerdo_pago_bilateral",
];
