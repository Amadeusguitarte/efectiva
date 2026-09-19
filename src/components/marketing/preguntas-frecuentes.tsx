import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SECCIONES } from "@/config/navegacion";
import { preguntasFrecuentes } from "@/content/preguntas-frecuentes";

export function PreguntasFrecuentes() {
  return (
    <section id={SECCIONES.preguntas} className="bg-surface-soft py-20">
      <div className="container-page mb-16 px-4 text-center">
        <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">
          Preguntas frecuentes
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Resolvemos tus dudas sobre la Ley de Insolvencia.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4">
        <Accordion type="single" collapsible className="space-y-4">
          {preguntasFrecuentes.map(({ pregunta, respuesta }, indice) => (
            <AccordionItem
              key={pregunta}
              value={`pregunta-${indice}`}
              className="overflow-hidden rounded-3xl border bg-white px-6 shadow-soft transition-shadow duration-300 last:border-b hover:shadow-elegant md:px-8"
            >
              <AccordionTrigger className="py-6 text-left text-lg font-bold text-foreground hover:text-primary hover:no-underline">
                {pregunta}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-lg leading-relaxed text-muted-foreground">
                {respuesta}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
