import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Quién puede acogerse a la Ley de Insolvencia?",
    answer: "Pueden acogerse personas naturales no comerciantes y comerciantes persona natural que no pueden cumplir con sus obligaciones financieras. También pequeñas empresas con deudas que excedan su capacidad de pago. Es importante demostrar la buena fe y voluntad de pago."
  },
  {
    question: "¿Voy a perder mis bienes o mi casa?",
    answer: "No necesariamente. La Ley de Insolvencia permite proteger tu vivienda familiar y ciertos bienes inembargables. El objetivo es reestructurar las deudas, no quitarte tu patrimonio. Trabajamos para que conserves lo esencial mientras pagas de forma ordenada."
  },
  {
    question: "¿Cuánto tiempo dura el proceso de insolvencia?",
    answer: "El proceso varía según cada caso, pero generalmente toma entre 6 meses a 2 años desde la radicación hasta la aprobación del plan de pagos. Una vez aprobado, el plan puede extenderse hasta 5 años para personas naturales."
  },
  {
    question: "¿Puedo seguir trabajando durante el proceso?",
    answer: "¡Por supuesto! De hecho, es fundamental que mantengas tu fuente de ingresos. La Ley de Insolvencia te permite seguir trabajando, emprendiendo y generando ingresos para cumplir con tu plan de pagos acordado."
  },
  {
    question: "¿Cuánto cuesta el proceso?",
    answer: "Los costos varían según la complejidad del caso. En la consulta inicial gratuita evaluamos tu situación y te damos un presupuesto claro. Ofrecemos planes de pago accesibles para nuestros honorarios profesionales."
  },
  {
    question: "¿Los bancos dejarán de cobrarme?",
    answer: "Una vez se radica el proceso, se suspenden las acciones de cobro judicial y los intereses. Esto te da un respiro legal mientras se negocia y aprueba tu plan de pagos. Es una protección legal muy importante."
  }
];

export const FAQ = () => {
  return (
    <section className="py-20 gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Preguntas Frecuentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Resolvemos tus dudas sobre la Ley de Insolvencia
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-6 shadow-soft"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};