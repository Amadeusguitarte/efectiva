import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Briefcase, AlertCircle } from "lucide-react";

const services = [
  {
    icon: User,
    title: "Insolvencia para Personas Naturales",
    description: "Si tienes deudas personales que no puedes pagar, te ayudamos a acogerte a la Ley de Insolvencia para proteger tu patrimonio y reestructurar tus obligaciones.",
    features: ["Protección de vivienda", "Detención de embargos", "Negociación con acreedores", "Plan de pago personalizado"]
  },
  {
    icon: Briefcase,
    title: "Insolvencia para Empresarios",
    description: "Apoyamos a pequeños empresarios y emprendedores a salvar sus negocios mediante la reestructuración legal de sus deudas empresariales.",
    features: ["Salvamento empresarial", "Reorganización financiera", "Protección de activos", "Continuidad del negocio"]
  },
  {
    icon: AlertCircle,
    title: "Asesoría Preventiva",
    description: "Te orientamos antes de que la situación se complique. Analizamos tu caso y te damos las mejores opciones legales y financieras disponibles.",
    features: ["Análisis financiero", "Estrategias preventivas", "Orientación legal", "Plan de acción"]
  }
];

export const Services = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Nuestros Servicios
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Soluciones legales especializadas para cada situación
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="p-8 hover:shadow-elegant transition-smooth hover:-translate-y-1 bg-card border-border shadow-soft flex flex-col"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <service.icon className="h-8 w-8 text-primary" />
              </div>

              <h3 className="text-2xl font-semibold mb-4 text-card-foreground">
                {service.title}
              </h3>

              <p className="text-muted-foreground mb-6">
                {service.description}
              </p>

              <ul className="space-y-3 mb-6 flex-grow">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full"
                onClick={() => window.scrollTo({ top: document.getElementById('contact')?.offsetTop || 0, behavior: 'smooth' })}
              >
                Solicitar Información
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};