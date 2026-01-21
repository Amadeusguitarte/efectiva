import { Calendar, Search, FileText, Heart } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Calendar,
    title: "Agenda tu consulta gratis",
    description: "Conversamos sobre tu situación financiera sin ningún compromiso"
  },
  {
    number: "02",
    icon: Search,
    title: "Analizamos tu caso",
    description: "Evaluamos tu situación y determinamos la mejor estrategia legal"
  },
  {
    number: "03",
    icon: FileText,
    title: "Iniciamos el proceso",
    description: "Radicamos tu proceso de insolvencia ante las autoridades competentes"
  },
  {
    number: "04",
    icon: Heart,
    title: "Recuperas tu tranquilidad",
    description: "Vives libre de presiones mientras cumples tu plan de pago acordado"
  }
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            ¿Cómo Funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un proceso simple y transparente en 4 pasos
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line - Hidden on last item */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-primary/20 z-0" />
                )}

                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4 shadow-elegant">
                    {step.number}
                  </div>

                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};