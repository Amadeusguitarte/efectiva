import { Search, ShieldCheck, Handshake, Heart, Phone } from "lucide-react";

const steps = [
    {
        number: 1,
        title: "Analizamos tu situación financiera",
        description: "Estudiamos tu caso en detalle: deudas, ingresos, procesos judiciales y capacidad real de pago.",
        highlight: "Con esta información definimos la estrategia legal más conveniente para ti, sin improvisaciones.",
        footer: "👉 Nada genérico. Todo adaptado a tu realidad.",
        icon: Search
    },
    {
        number: 2,
        title: "Activamos tu protección legal",
        subtitle: "Una vez iniciado el proceso de insolvencia:",
        bullets: [
            "Se suspenden embargos y procesos ejecutivos",
            "Se detienen intereses y cobros abusivos",
            "Recuperas estabilidad mientras avanzamos en la solución"
        ],
        footer: "La ley te protege desde el inicio del trámite.",
        icon: ShieldCheck
    },
    {
        number: 3,
        title: "Negociamos o liquidamos, según tu caso",
        subtitle: "La Ley de Insolvencia ofrece dos caminos legales, y te guiamos en el más conveniente:",
        bullets: [
            "Acuerdo de pago: renegociamos tus deudas con reducción de intereses y cuotas ajustadas a tu capacidad real.",
            "Liquidación patrimonial: entregas tus bienes (si los tienes) y quedas libre de todas tus obligaciones."
        ],
        footer: "Si no tienes bienes, también puedes acceder a este mecanismo.",
        icon: Handshake
    },
    {
        number: 4,
        title: "Acompañamiento integral hasta el final",
        subtitle: "No te dejamos solo en ningún momento.",
        bullets: [
            "Te representamos ante acreedores y autoridades",
            "Gestionamos audiencias y trámites",
            "Te explicamos cada etapa con claridad"
        ],
        footer: "Nuestro objetivo no es solo resolver tus deudas, sino devolver tu tranquilidad financiera y personal.",
        icon: Heart
    }
];

export const StepByStep = () => {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                        ¿Cómo te ayudamos paso a paso?
                    </h2>
                </div>

                <div className="max-w-4xl mx-auto space-y-16">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-8 items-start relative pb-16">
                            {/* Vertical line connector */}
                            {index !== steps.length - 1 && (
                                <div className="absolute left-7 top-16 bottom-0 w-0.5 bg-primary/20 hidden md:block" />
                            )}

                            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg z-10">
                                {step.number}
                            </div>

                            <div className="flex-grow pt-2">
                                <h3 className="text-2xl font-bold text-primary mb-4">
                                    {step.title}
                                </h3>

                                <div className="text-lg text-muted-foreground space-y-4">
                                    {step.description && <p>{step.description}</p>}

                                    {step.highlight && (
                                        <p>
                                            {step.highlight.split('estrategia legal más conveniente para ti').map((part, i) => (
                                                <span key={i}>
                                                    {part}
                                                    {i === 0 && <strong className="font-extrabold text-foreground">estrategia legal más conveniente para ti</strong>}
                                                </span>
                                            ))}
                                        </p>
                                    )}

                                    {step.subtitle && <p>{step.subtitle}</p>}

                                    {step.bullets && (
                                        <ul className="space-y-3 list-none">
                                            {step.bullets.map((bullet, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                                                    <span>
                                                        {bullet.split(/(suspenden embargos y procesos ejecutivos|detienen intereses y cobros abusivos|dos caminos legales|renegociamos|libre de todas tus obligaciones|devolver tu tranquilidad financiera y personal)/).map((p, j) => (
                                                            <span key={j} className={p.match(/suspenden|detienen|dos caminos|renegociamos|libre|devolver/) ? "font-extrabold text-foreground" : ""}>
                                                                {p}
                                                            </span>
                                                        ))}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="pt-4 border-t border-border/50">
                                        <p className="italic font-medium text-foreground/80">
                                            {step.footer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Final CTA section */}
                <div className="max-w-4xl mx-auto mt-20 pt-20 border-t border-border">
                    <div className="text-center space-y-8">
                        <h4 className="text-3xl font-bold text-foreground">Tu situación tiene solución</h4>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Si las deudas ya no te dejan avanzar, <strong className="font-extrabold text-foreground text-2xl px-1">actuar a tiempo marca la diferencia.</strong>
                        </p>

                        <div className="bg-[#f8f9fc] p-8 rounded-3xl border border-primary/20 shadow-soft max-w-2xl mx-auto">
                            <div className="flex flex-col items-center space-y-6">
                                <div className="flex items-center gap-4 text-xl md:text-2xl text-foreground font-medium">
                                    <Phone className="h-8 w-8 text-primary animate-bounce" />
                                    <span>Agenda una asesoría gratuita y descubre cómo iniciar tu proceso de insolvencia de forma segura, legal y estratégica.</span>
                                </div>

                                <button
                                    onClick={() => window.scrollTo({ top: document.getElementById('contact')?.offsetTop || 0, behavior: 'smooth' })}
                                    className="inline-flex items-center gap-2 text-2xl font-extrabold text-primary hover:text-primary/80 transition-smooth group"
                                >
                                    👉 <span>Quiero asesoría ahora</span>
                                    <div className="h-0.5 w-0 group-hover:w-full bg-primary transition-all duration-300" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
