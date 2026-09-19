import { Award, CalendarCheck, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";

import juanHernandez from "@/assets/images/juan-hernandez.webp";
import { CalendlyEmbed } from "@/components/marketing/calendly-embed";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SECCIONES } from "@/config/navegacion";
import { siteConfig } from "@/config/site";

function DatoContacto({
  icono: Icono,
  etiqueta,
  children,
}: {
  icono: LucideIcon;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icono className="size-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{etiqueta}</p>
        <div className="text-sm font-semibold break-words text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function AgendaConsulta() {
  const { contact, advisor } = siteConfig;

  return (
    <section id={SECCIONES.agenda} className="bg-background py-20">
      <div className="container-page px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">
            Agenda tu consulta gratuita
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Elige el horario que mejor te convenga y recibe asesoría experta de inmediato.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-4">
            <Card className="relative gap-0 overflow-hidden border-primary/20 p-6 shadow-elegant">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-24 bg-linear-to-br from-primary to-primary/60 opacity-20"
              />
              <div className="relative z-10 flex flex-col items-center text-center">
                <Image
                  src={juanHernandez}
                  alt={advisor.name}
                  sizes="128px"
                  className="mb-4 size-32 rounded-full border-4 border-background object-cover shadow-xl"
                />
                <h3 className="text-2xl font-bold text-foreground">{advisor.name}</h3>
                <p className="mb-4 font-medium text-primary">{advisor.role}</p>
                <p className="mb-6 flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
                  <Award className="size-4 text-primary" />
                  Experto en Ley de Insolvencia
                </p>

                <div className="w-full space-y-4 border-t pt-6 text-left">
                  <DatoContacto icono={Phone} etiqueta="Llámanos">
                    <a href={`tel:${contact.phoneE164}`} className="hover:text-primary">
                      {contact.phoneDisplay}
                    </a>
                  </DatoContacto>
                  <DatoContacto icono={Mail} etiqueta="Escríbenos">
                    <a href={`mailto:${contact.email}`} className="hover:text-primary">
                      {contact.email}
                    </a>
                  </DatoContacto>
                  <DatoContacto icono={MapPin} etiqueta="Visítanos">
                    {contact.city}, {contact.country}
                  </DatoContacto>
                </div>
              </div>
            </Card>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6">
              <div className="flex items-start gap-4">
                <CalendarCheck className="mt-1 size-8 shrink-0 text-primary" />
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">¿Qué pasará en la cita?</h4>
                  <p className="text-sm text-muted-foreground">
                    Analizaremos tus deudas y te diremos exactamente cuánto podrías ahorrarte con la
                    ley.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-[600px] rounded-2xl border bg-card p-4 shadow-soft lg:col-span-8">
            <Suspense fallback={<Skeleton className="h-[650px] w-full rounded-xl" />}>
              <CalendlyEmbed />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
