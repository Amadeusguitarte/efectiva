/**
 * Preferencia del menú lateral del panel: si está minimizado y qué tamaño ocupa.
 *
 * Se guarda en una cookie (no en localStorage) para que el layout del servidor la lea y
 * pinte el estado correcto desde el primer render, sin parpadeo ni errores de hidratación.
 * Este módulo no depende del servidor ni del navegador: lo usan ambos lados.
 */

export const COOKIE_MENU_ADMIN = "menu_admin";

/** Un año, en segundos. */
export const DURACION_COOKIE_MENU = 60 * 60 * 24 * 365;

export const TAMANOS_MENU = ["compacto", "normal", "amplio"] as const;

export type TamanoMenu = (typeof TAMANOS_MENU)[number];

export type PreferenciaMenu = { minimizado: boolean; tamano: TamanoMenu };

export const PREFERENCIA_MENU_INICIAL: PreferenciaMenu = { minimizado: false, tamano: "normal" };

export function esTamanoMenu(valor: unknown): valor is TamanoMenu {
  return typeof valor === "string" && (TAMANOS_MENU as readonly string[]).includes(valor);
}

/**
 * Interpreta el valor de la cookie (`expandido.normal`, `minimizado.amplio`…) con lista blanca:
 * cualquier parte desconocida o manipulada vuelve al valor por defecto.
 */
export function leerPreferenciaMenu(valor: string | null | undefined): PreferenciaMenu {
  if (!valor || valor.length > 40) return PREFERENCIA_MENU_INICIAL;
  const [estado, tamano] = valor.split(".");
  return {
    minimizado: estado === "minimizado",
    tamano: esTamanoMenu(tamano) ? tamano : PREFERENCIA_MENU_INICIAL.tamano,
  };
}

export function serializarPreferenciaMenu({ minimizado, tamano }: PreferenciaMenu): string {
  return `${minimizado ? "minimizado" : "expandido"}.${tamano}`;
}
