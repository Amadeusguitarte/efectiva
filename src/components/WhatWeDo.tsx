import { Shield, TrendingDown, Home, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import patternBg from "@/assets/pattern-bg.jpg";

const benefits = [
  {
    icon: Shield,
    title: "Detén embargos y demandas",
    description: "Protégete legalmente de acciones judiciales mientras resuelves tu situación financiera"
  },
  {
    icon: TrendingDown,
    title: "Reduce tus deudas",
    description: "Detén intereses y negocia un plan de pago acorde a tu capacidad real"
  },
  {
    icon: Home,
    title: "Protege tus bienes",
    description: "Salvaguarda tu vivienda y patrimonio familiar bajo protección legal"
  },
  {
    icon: Users,
    title: "Asesoría experta",
    description: "Acompañamiento legal especializado en todo el proceso de insolvencia"
  }
];

export const WhatWeDo = () => {
  return (
    <section className="py-20 gradient-subtle relative overflow-hidden">
      {/* Background Pattern with low opacity */}
      <div className="absolute inset-0 z-0">
        <img 
          src={patternBg} 
          alt="" 
          className="w-full h-full object-cover opacity-5"
        />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            ¿Qué Hacemos?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            La <strong>Ley de Insolvencia</strong> es una herramienta legal que permite a personas naturales y pequeñas empresas 
            que no pueden pagar sus deudas, reestructurarlas de forma legal, deteniendo intereses y protegiendo su patrimonio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card 
              key={index} 
              className="p-6 text-center hover:shadow-elegant transition-smooth hover:-translate-y-1 bg-card border-border shadow-soft"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground">
                {benefit.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};