import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "1️⃣ ¿Quién puede acogerse a la Ley de Insolvencia?",
    answer: "Cualquier persona natural no comerciante (empleado, independiente, pensionado) que tenga dos o más deudas en mora por más de 90 días y cuyos pasivos representen al menos el 30% del total de sus obligaciones."
  },
  {
    question: "2️⃣ ¿Qué pasa cuando inicio el proceso de insolvencia?",
    answer: "Desde que el proceso es admitido: se suspenden embargos, se detienen procesos judiciales y se congelan intereses. Esto te da un respiro legal mientras se construye la solución."
  },
  {
    question: "3️⃣ ¿Voy a perder mi casa, mi carro o mis bienes?",
    answer: "No necesariamente. La ley permite negociar primero tus deudas. Solo si optas por la liquidación patrimonial se entregan los bienes. Si no tienes bienes, igual puedes acceder y quedar libre de deudas."
  },
  {
    question: "4️⃣ ¿Cuánto tiempo tarda el proceso de insolvencia?",
    answer: "Depende del caso, pero en promedio toma de 1 a 3 meses para acuerdos de pago y un poco más si hay liquidación. Siempre te mantenemos informado en cada etapa."
  },
  {
    question: "5️⃣ ¿Puedo seguir trabajando durante el proceso?",
    answer: "Sí. El proceso no afecta tu empleo, ni pueden despedirte o sancionarte por acogerte a la insolvencia. Sigues trabajando con normalidad."
  },
  {
    question: "6️⃣ ¿Los bancos dejan de llamarme y cobrarme?",
    answer: "Sí. Una vez iniciado el proceso, los cobros directos y presiones deben canalizarse legalmente, evitando acoso y prácticas abusivas."
  },
  {
    question: "7️⃣ ¿Qué opciones ofrece la Ley de Insolvencia?",
    answer: "La ley ofrece dos caminos legales: 1. Acuerdo de pago ajustado a tu capacidad real. 2. Liquidación patrimonial para quedar libre de deudas. Te asesoramos para elegir la mejor opción."
  },
  {
    question: "8️⃣ ¿Necesito un abogado para el proceso?",
    answer: "Sí. Es un proceso legal y técnico. Contar con abogados especializados evita errores, rechazos y acuerdos desfavorables."
  },
  {
    question: "9️⃣ ¿Cuánto cuesta iniciar el proceso?",
    answer: "El costo depende de la complejidad del caso. Por eso ofrecemos una asesoría gratuita donde evaluamos tu situación y te explicamos todo antes de avanzar."
  },
  {
    question: "🔟 ¿Qué resultados puedo esperar?",
    answer: "Según tu caso, puedes lograr la reducción significativa de intereses, la suspensión de embargos y libranzas, acuerdos de pago viables o quedar libre de todas tus deudas."
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