import { Phone } from "lucide-react";
import Image from "next/image";

import heroFamilia from "@/assets/images/hero-familia.webp";
import { EfectoBrillo } from "@/components/marketing/efecto-brillo";
import { Button } from "@/components/ui/button";
import { SECCIONES } from "@/config/navegacion";
import { yearsOfExperience } from "@/config/site";

export function Hero() {
  const anos = yearsOfExperience();
  const sellos = ["100% legal", "Consulta gratuita", `Más de ${anos} años de experiencia`];

  return (
    <section className="relative flex min-h-[85vh] items-start overflow-hidden bg-hero pt-40 md:pt-56">
      <div className="absolute inset-0 z-0">
        <Image
          src={heroFamilia}
          alt="Familia sonriente que recuperó su libertad financiera"
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          className="object-cover object-[center_top] lg:object-[right_top]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/40 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 container-page px-4">
        <div className="max-w-2xl text-white">
          <h1 className="mb-6 animate-in text-5xl leading-tight font-bold drop-shadow-2xl duration-700 fade-in slide-in-from-bottom-4 md:text-7xl">
            Recupera tu libertad financiera
          </h1>

          <p className="mb-8 max-w-3xl animate-in text-lg leading-relaxed font-light tracking-wide text-white/95 drop-shadow-md delay-150 duration-700 fade-in slide-in-from-bottom-4 md:text-xl">
            Con más de {anos} años de experiencia, ayudamos a personas naturales y pequeños
            empresarios a resolver sus deudas de forma{" "}
            <strong className="font-extrabold text-white">legal, ordenada y definitiva</strong>, a
            través de la Ley de Insolvencia en Colombia.
          </p>

          <div className="flex animate-in flex-col gap-4 delay-300 duration-700 fade-in slide-in-from-bottom-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group relative h-12 w-full overflow-hidden px-8 text-lg shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-elegant active:scale-95 sm:w-auto"
            >
              <a href={`#${SECCIONES.agenda}`}>
                <Phone className="size-5 transition-transform group-hover:rotate-12" />
                Agendar una llamada gratuita
                <EfectoBrillo />
              </a>
            </Button>
          </div>

          <ul className="mt-10 flex animate-in flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/90 delay-500 duration-700 fade-in">
            {sellos.map((sello) => (
              <li key={sello} className="flex items-center gap-2">
                <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                <span className="font-medium">{sello}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
