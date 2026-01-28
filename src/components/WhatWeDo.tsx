import { Shield, TrendingDown, Home, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import patternBg from "@/assets/pattern-bg.jpg";

const benefits = [
  {
    icon: Shield,
    title: "Detén embargos y demandas",
    description: "Te protegemos legalmente frente a procesos judiciales, embargos y acciones de cobro mientras se desarrolla tu proceso de insolvencia."
  },
  {
    icon: TrendingDown,
    title: "Reduce tus deudas",
    description: "Negociamos con tus acreedores un plan de pago acorde a tu capacidad real, aplicando la máxima reducción de intereses permitida por la ley."
  },
  {
    icon: Home,
    title: "Protege tus bienes",
    description: "Buscamos salvaguardar tu vivienda y patrimonio familiar dentro del marco legal, priorizando soluciones que eviten pérdidas innecesarias."
  },
  {
    icon: Users,
    title: "Asesoría experta",
    description: "Recibes acompañamiento jurídico especializado durante todo el proceso, con información clara y decisiones basadas en tu situación real."
  }
];

export const WhatWeDo = () => {
  return (
    <section className="py-20 bg-[#f8f9fc] relative overflow-hidden border-b border-border/50">
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
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            ¿Qué Hacemos?
          </h2>
          <div className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed space-y-4">
            <p>
              La Ley de Insolvencia es una herramienta legal que permite a las personas naturales
              que no pueden cumplir normalmente con sus obligaciones financieras <strong className="font-extrabold text-foreground">reorganizar
                o liquidar sus deudas</strong>, deteniendo intereses, procesos judiciales y protegiendo su
              patrimonio.
            </p>
            <p>
              En <strong className="font-extrabold text-foreground">Insolvencia Efectiva</strong> te acompañamos durante todo el proceso, desde el análisis
              inicial hasta la solución final.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="p-6 text-center hover:shadow-elegant transition-smooth hover:-translate-y-1 bg-card border-border shadow-soft h-full"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-card-foreground">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};