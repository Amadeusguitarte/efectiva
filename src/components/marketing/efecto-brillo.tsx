/** Destello que recorre un botón al pasar el cursor. El contenedor necesita `relative overflow-hidden group`. */
export function EfectoBrillo() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent group-hover:animate-shine"
    />
  );
}
