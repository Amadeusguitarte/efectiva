import { Home, Shield, TrendingDown, Users } from "lucide-react";
import Image from "next/image";

import patronFondo from "@/assets/images/patron-fondo.webp";
import { Card } from "@/components/ui/card";
import { SECCIONES } from "@/config/navegacion";
import { siteConfig } from "@/config/site";

const beneficios = [
  {
    icono: Shield,
    titulo: "Detén embargos y demandas",
    descripcion:
      "Te protegemos legalmente frente a procesos judiciales, embargos y acciones de cobro mientras se desarrolla tu proceso de insolvencia.",
  },
  {
    icono: TrendingDown,
    titulo: "Reduce tus deudas",
    descripcion:
      "Negociamos con tus acreedores un plan de pago acorde a tu capacidad real, aplicando la máxima reducción de intereses permitida por la ley.",
  },
  {
    icono: Home,
    titulo: "Protege tus bienes",
    descripcion:
      "Buscamos salvaguardar tu vivienda y patrimonio familiar dentro del marco legal, priorizando soluciones que eviten pérdidas innecesarias.",
  },
  {
    icono: Users,
    titulo: "Asesoría experta",
    descripcion:
      "Recibes acompañamiento jurídico especializado durante todo el proceso, con información clara y decisiones basadas en tu situación real.",
  },
];

export function Beneficios() {
  return (
    <section
      id={SECCIONES.beneficios}
      className="relative overflow-hidden border-b border-border/50 bg-surface-soft py-20"
    >
      <Image src={patronFondo} alt="" fill sizes="100vw" className="z-0 object-cover opacity-5" />

      <div className="relative z-10 container-page px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-3xl font-bold text-foreground md:text-5xl">¿Qué hacemos?</h2>
          <div className="mx-auto max-w-4xl space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              La Ley de Insolvencia es una herramienta legal que permite a las personas naturales
              que no pueden cumplir normalmente con sus obligaciones financieras{" "}
              <strong className="font-extrabold text-foreground">
                reorganizar o liquidar sus deudas
              </strong>
              , deteniendo intereses, procesos judiciales y protegiendo su patrimonio.
            </p>
            <p>
              En <strong className="font-extrabold text-foreground">{siteConfig.name}</strong> te
              acompañamos durante todo el proceso, desde el análisis inicial hasta la solución
              final.
            </p>
          </div>
        </div>

        <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {beneficios.map(({ icono: Icono, titulo, descripcion }) => (
            <li key={titulo}>
              <Card className="h-full gap-0 p-6 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
                <div className="mx-auto mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Icono className="size-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-card-foreground">{titulo}</h3>
                <p className="leading-relaxed text-muted-foreground">{descripcion}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
