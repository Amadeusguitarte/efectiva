import { InlineWidget } from "react-calendly";
import { Card } from "@/components/ui/card";
import { Phone, Mail, MapPin, Award, CalendarCheck } from "lucide-react";

export const ContactForm = () => {
  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Agenda Tu Consulta Gratuita
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige el horario que mejor te convenga y recibe asesoría experta de inmediato.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column: Advisor Profile & Info */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="p-6 border-primary/20 bg-card shadow-elegant overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-hero opacity-20" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full border-4 border-background shadow-xl mb-4 overflow-hidden">
                  <img
                    src="/juan-hernandez.png"
                    alt="Juan Hernandez"
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="text-2xl font-bold text-foreground">Juan Hernandez</h3>
                <p className="text-primary font-medium mb-4">Representante Insolvencia Efectiva</p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full mb-6">
                  <Award className="w-4 h-4 text-primary" />
                  <span>Experto en Ley de Insolvencia</span>
                </div>

                <div className="w-full space-y-4 text-left border-t pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Llámanos</p>
                      <p className="font-semibold text-foreground">+57 319 542 0600</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Escríbenos</p>
                      <p className="font-semibold text-foreground text-sm">insolvenciaefectivacolombia@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Visítanos</p>
                      <p className="font-semibold text-foreground text-sm">Bogotá, Colombia</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
              <div className="flex items-start gap-4">
                <CalendarCheck className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">¿Qué pasará en la cita?</h4>
                  <p className="text-sm text-muted-foreground">Analizaremos tus deudas y te diremos exactamente cuánto podrías ahorrarte con la ley.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Calendly Widget */}
          <div className="lg:col-span-8 bg-card rounded-2xl shadow-soft border border-border p-4 min-h-[600px]">
            {/* 
              IMPORTANT: Replace the 'url' below with your actual Calendly URL 
              Example: https://calendly.com/tu-usuario/asesoria-gratuita
            */}
            <InlineWidget
              url="https://calendly.com/insolvenciaefectivacolombia/30min"
              styles={{
                height: '100%',
                minHeight: '650px',
                width: '100%'
              }}
              pageSettings={{
                hideGdprBanner: true,
                hideEventTypeDetails: false,
                hideLandingPageDetails: false,
              }}
              prefill={{
                email: 'insolvenciaefectivacolombia@gmail.com',
                name: 'Cliente Insolvencia'
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};