import { Award, CheckCircle, TrendingUp, Users } from "lucide-react";

import { SECCIONES } from "@/config/navegacion";
import { siteConfig, yearsOfExperience } from "@/config/site";

export function PorQueElegirnos() {
  const ventajas = [
    {
      icono: Award,
      titulo: `${yearsOfExperience()} años de experiencia`,
      descripcion: `Acompañando procesos de insolvencia en Colombia desde ${siteConfig.foundedYear}.`,
    },
    {
      icono: CheckCircle,
      titulo: "Resultados comprobados",
      descripcion: "Más del 95% de nuestros clientes logran reestructurar exitosamente.",
    },
    {
      icono: Users,
      titulo: "Equipo especializado",
      descripcion: "Abogados expertos en derecho concursal y financiero.",
    },
    {
      icono: TrendingUp,
      titulo: "Cientos de clientes ayudados",
      descripcion: "Personas y empresas que han recuperado su estabilidad financiera.",
    },
  ];

  return (
    <section id={SECCIONES.nosotros} className="bg-primary py-20 text-primary-foreground">
      <div className="container-page px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-5xl">¿Por qué elegirnos?</h2>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/90">
            Somos tu mejor opción para resolver tu situación financiera legalmente.
          </p>
        </div>

        <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {ventajas.map(({ icono: Icono, titulo, descripcion }) => (
            <li
              key={titulo}
              className="group text-center transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="mb-4 inline-flex size-20 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors duration-300 group-hover:bg-primary-foreground/20">
                <Icono className="size-10 text-primary-foreground" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">{titulo}</h3>
              <p className="text-primary-foreground/80">{descripcion}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
