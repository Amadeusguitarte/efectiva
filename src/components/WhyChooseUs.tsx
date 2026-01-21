import { Award, CheckCircle, Users, TrendingUp } from "lucide-react";

const advantages = [
  {
    icon: Award,
    title: "16 Años de Experiencia",
    description: "Líderes en Colombia en procesos de insolvencia desde 2008"
  },
  {
    icon: CheckCircle,
    title: "Resultados Comprobados",
    description: "Más del 95% de nuestros clientes logran reestructurar exitosamente"
  },
  {
    icon: Users,
    title: "Equipo Especializado",
    description: "Abogados expertos en derecho concursal y financiero"
  },
  {
    icon: TrendingUp,
    title: "Cientos de Clientes Ayudados",
    description: "Personas y empresas que han recuperado su estabilidad financiera"
  }
];

export const WhyChooseUs = () => {
  return (
    <section id="about" className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            ¿Por Qué Elegirnos?
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Somos tu mejor opción para resolver tu situación financiera legalmente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {advantages.map((advantage, index) => (
            <div
              key={index}
              className="text-center group hover:-translate-y-2 transition-smooth"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-foreground/10 mb-4 group-hover:bg-primary-foreground/20 transition-smooth">
                <advantage.icon className="h-10 w-10 text-primary-foreground" />
              </div>

              <h3 className="text-xl font-semibold mb-3">
                {advantage.title}
              </h3>
              <p className="text-primary-foreground/80">
                {advantage.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};