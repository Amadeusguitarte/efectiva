/**
 * Preferencia del menú lateral del panel: si está minimizado y qué ancho ocupa (se ajusta
 * arrastrando la pestaña del borde).
 *
 * Se guarda en una cookie (no en localStorage) para que el layout del servidor la lea y
 * pinte el estado correcto desde el primer render, sin parpadeo ni errores de hidratación.
 * Este módulo no depende del servidor ni del navegador: lo usan ambos lados.
 */

export const COOKIE_MENU_ADMIN = "menu_admin";

/** Un año, en segundos. */
export const DURACION_COOKIE_MENU = 60 * 60 * 24 * 365;

/** Límites del ancho del menú expandido, en píxeles. */
export const ANCHO_MENU_MINIMO = 200;
export const ANCHO_MENU_MAXIMO = 420;
export const ANCHO_MENU_POR_DEFECTO = 256;

/** Ancho del menú minimizado (solo iconos), en píxeles. */
export const ANCHO_MENU_MINIMIZADO = 68;

/**
 * Al arrastrar, por debajo de este ancho el menú se minimiza (y por encima vuelve a expandirse):
 * así no hace falta buscar el botón para recogerlo.
 */
export const UMBRAL_MINIMIZAR = (ANCHO_MENU_MINIMIZADO + ANCHO_MENU_MINIMO) / 2;

export type PreferenciaMenu = { minimizado: boolean; ancho: number };

export const PREFERENCIA_MENU_INICIAL: PreferenciaMenu = {
  minimizado: false,
  ancho: ANCHO_MENU_POR_DEFECTO,
};

/** Equivalencia de los tamaños fijos que guardaba la versión anterior de la cookie. */
const TAMANOS_ANTERIORES: Record<string, number> = { compacto: 216, normal: 256, amplio: 304 };

export function limitarAnchoMenu(ancho: number): number {
  if (!Number.isFinite(ancho)) return ANCHO_MENU_POR_DEFECTO;
  return Math.round(Math.min(ANCHO_MENU_MAXIMO, Math.max(ANCHO_MENU_MINIMO, ancho)));
}

/**
 * Interpreta el valor de la cookie (`expandido.256`, `minimizado.300`…) con lista blanca: un
 * estado desconocido cuenta como expandido y un ancho que no es un entero se descarta. Acepta
 * también los nombres de la versión anterior (`normal`, `amplio`…).
 */
export function leerPreferenciaMenu(valor: string | null | undefined): PreferenciaMenu {
  if (!valor || valor.length > 40) return PREFERENCIA_MENU_INICIAL;
  const [estado, ancho = ""] = valor.split(".");
  const anterior = Object.hasOwn(TAMANOS_ANTERIORES, ancho) ? TAMANOS_ANTERIORES[ancho] : undefined;
  return {
    minimizado: estado === "minimizado",
    ancho:
      anterior ??
      (/^\d{1,4}$/.test(ancho) ? limitarAnchoMenu(Number(ancho)) : ANCHO_MENU_POR_DEFECTO),
  };
}

export function serializarPreferenciaMenu({ minimizado, ancho }: PreferenciaMenu): string {
  return `${minimizado ? "minimizado" : "expandido"}.${limitarAnchoMenu(ancho)}`;
}

/**
 * Resultado de arrastrar la pestaña del borde hasta `anchoArrastrado` píxeles: por debajo del
 * umbral el menú se minimiza y conserva el último ancho expandido; por encima se expande con el
 * ancho limitado.
 */
export function preferenciaTrasArrastre(
  actual: PreferenciaMenu,
  anchoArrastrado: number,
): PreferenciaMenu {
  if (anchoArrastrado < UMBRAL_MINIMIZAR) return { ...actual, minimizado: true };
  return { minimizado: false, ancho: limitarAnchoMenu(anchoArrastrado) };
}
