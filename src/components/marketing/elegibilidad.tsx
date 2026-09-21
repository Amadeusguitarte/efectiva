import { ArrowRight, CheckCircle2, Clock, Scale, User } from "lucide-react";

import { EfectoBrillo } from "@/components/marketing/efecto-brillo";
import { SECCIONES } from "@/config/navegacion";

const requisitos = [
  {
    icono: User,
    titulo: "Persona natural",
    descripcion: "No comerciante (empleado, independiente, pensionado o servidor público).",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icono: Clock,
    titulo: "Mora de 90+ días",
    descripcion: "Dos o más deudas vencidas o procesos de cobro judicial vigentes.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icono: Scale,
    titulo: "Deuda del 30%",
    descripcion:
      "El valor de las deudas en mora representa al menos el 30% del total de tus obligaciones.",
    color: "bg-emerald-50 text-emerald-600",
  },
];

export function Elegibilidad() {
  return (
    <section id={SECCIONES.elegibilidad} className="relative overflow-hidden bg-white py-24">
      <div className="relative z-10 container-page px-4">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <h2 className="mb-6 text-3xl leading-tight font-bold text-foreground md:text-5xl">
            ¿Quién puede acogerse al proceso de{" "}
            <span className="text-primary italic">insolvencia?</span>
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            Este mecanismo legal está diseñado para personas que, por su situación financiera
            actual,
            <strong className="font-bold text-foreground">
              {" "}
              ya no pueden cumplir normalmente con sus obligaciones.
            </strong>
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
            <CheckCircle2 className="size-4" />
            Estos son los requisitos principales:
          </p>
        </div>

        <ul className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {requisitos.map(({ icono: Icono, titulo, descripcion, color }) => (
            <li
              key={titulo}
              className="group rounded-[2.5rem] border bg-white p-8 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-elegant"
            >
              <div
                className={`mb-6 flex size-16 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110 ${color}`}
              >
                <Icono className="size-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">{titulo}</h3>
              <p className="leading-relaxed text-muted-foreground">{descripcion}</p>
            </li>
          ))}
        </ul>

        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[3rem] border border-primary/10 bg-surface-blue p-8 text-center md:p-12">
          <div
            aria-hidden
            className="absolute top-0 right-0 size-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"
          />
          <p className="mb-8 text-lg text-muted-foreground">
            Cada caso es distinto. Por eso, antes de iniciar,{" "}
            <strong className="font-bold text-foreground">
              analizamos tu situación para definir la estrategia legal más conveniente para ti.
            </strong>
          </p>
          <a
            href={`#${SECCIONES.agenda}`}
            className="group relative mx-auto inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary px-10 py-5 text-xl font-bold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-elegant active:scale-95 sm:w-auto"
          >
            <span className="relative z-10 flex items-center gap-3">
              Quiero una asesoría gratuita
              <ArrowRight className="size-6 transition-transform group-hover:translate-x-2" />
            </span>
            <EfectoBrillo />
          </a>
        </div>
      </div>
    </section>
  );
}
