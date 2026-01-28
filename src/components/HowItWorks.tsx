export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-[#f8f9fc] relative overflow-hidden">
      {/* Background Pattern with low opacity */}
      <div className="absolute inset-0 z-0">
        <img
          src={patternBg}
          alt=""
          className="w-full h-full object-cover opacity-5"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground leading-tight">
              ¿Cómo funciona el proceso de insolvencia con nosotros?
            </h2>
            <h3 className="text-xl md:text-2xl font-semibold mb-8 text-foreground/80 leading-relaxed border-l-4 border-primary pl-4 inline-block text-left">
              Acógete a la Ley de Insolvencia (Ley 1564 de 2012 – Insolvencia de Persona Natural)
            </h3>
          </div>

          <div className="space-y-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
            <p>
              Cuando las deudas se acumulan y ya no es posible ponerse al día, <strong className="font-extrabold text-foreground">la ley colombiana ofrece una salida legal, ordenada y definitiva</strong> para recuperar el control financiero.
            </p>

            <p>
              En <strong className="font-extrabold text-foreground">Insolvencia Efectiva</strong> utilizamos el régimen de insolvencia de persona natural para ayudarte a <strong className="font-extrabold text-foreground">detener cobros, suspender embargos y reorganizar tus obligaciones</strong> bajo condiciones reales y justas.
            </p>

            <p>
              Este no es un atajo ni una promesa vacía: es un <strong className="font-extrabold text-foreground">proceso legal respaldado por la ley</strong>, diseñado para personas que necesitan empezar de nuevo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};