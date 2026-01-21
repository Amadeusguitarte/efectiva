import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";
import testimonialBg from "@/assets/testimonial-bg.jpg";

const testimonials = [
  {
    name: "María González",
    role: "Comerciante - Bogotá",
    text: "Estaba desesperada con las deudas de mi negocio. Gracias a Insolvencia Efectiva logré detener los embargos y negociar un plan que puedo cumplir. Hoy mi negocio sigue adelante.",
    rating: 5
  },
  {
    name: "Carlos Ramírez",
    role: "Profesional Independiente - Medellín",
    text: "Después de perder mi empleo, las deudas se acumularon. El equipo me ayudó a reestructurar todo legalmente. Ahora tengo paz mental y un plan claro para salir adelante.",
    rating: 5
  },
  {
    name: "Ana Martínez",
    role: "Madre de Familia - Cali",
    text: "Me iban a embargar mi casa. Con la asesoría de Insolvencia Efectiva logré proteger mi vivienda y acordar cuotas que sí puedo pagar. Eternamente agradecida.",
    rating: 5
  }
];

export const Testimonials = () => {
  return (
    <section className="py-20 gradient-subtle relative overflow-hidden">
      {/* Background Image with low opacity */}
      <div className="absolute inset-0 z-0">
        <img 
          src={testimonialBg} 
          alt="" 
          className="w-full h-full object-cover opacity-5"
        />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Historias de Éxito
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conoce cómo hemos ayudado a cientos de colombianos a recuperar su estabilidad financiera
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="p-8 hover:shadow-elegant transition-smooth hover:-translate-y-1 bg-card border-border shadow-soft relative"
            >
              <Quote className="absolute top-4 right-4 h-10 w-10 text-primary/20" />
              
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-accent fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>

              <p className="text-card-foreground mb-6 italic">
                "{testimonial.text}"
              </p>

              <div>
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};