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
        <section className="py-24 bg-[#f8f9fc] relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                        ¿Cómo te ayudamos paso a paso?
                    </h2>
                    <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="group relative flex flex-col md:flex-row gap-6 md:gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700"
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                {/* Visual Timeline element */}
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-black shadow-elegant transition-smooth group-hover:scale-110 group-hover:rotate-3">
                                        {step.number}
                                    </div>
                                    {index !== steps.length - 1 && (
                                        <div className="flex-grow w-1 bg-gradient-to-b from-primary/30 to-transparent my-4 rounded-full min-h-[4rem]" />
                                    )}
                                </div>

                                {/* Content Card */}
                                <div className="flex-grow bg-white/70 backdrop-blur-sm p-8 rounded-3xl border border-white shadow-soft transition-smooth group-hover:shadow-elegant group-hover:-translate-y-1 border-l-8 border-l-primary ring-1 ring-black/5">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                                        <div className="p-3 rounded-xl bg-primary/10 w-fit">
                                            <step.icon className="h-8 w-8 text-primary" />
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-extrabold text-foreground">
                                            {step.title}
                                        </h3>
                                    </div>

                                    <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                                        {step.description && <p className="text-foreground/90 font-medium">{step.description}</p>}

                                        {step.highlight && (
                                            <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                                                <p className="text-foreground italic">
                                                    {step.highlight.split('estrategia legal más conveniente para ti').map((part, i) => (
                                                        <span key={i}>
                                                            {part}
                                                            {i === 0 && <strong className="font-extrabold text-primary underline decoration-primary/30 decoration-4 underline-offset-4">estrategia legal más conveniente para ti</strong>}
                                                        </span>
                                                    ))}
                                                </p>
                                            </div>
                                        )}

                                        {step.subtitle && <p className="font-semibold text-foreground/80">{step.subtitle}</p>}

                                        {step.bullets && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {step.bullets.map((bullet, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-border/50 shadow-sm transition-smooth hover:border-primary/30">
                                                        <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                                                        <span className="text-sm md:text-base leading-snug">
                                                            {bullet.split(/(suspenden embargos y procesos ejecutivos|detienen intereses y cobros abusivos|dos caminos legales|renegociamos|libre de todas tus obligaciones|devolver tu tranquilidad financiera y personal)/).map((p, j) => (
                                                                <span key={j} className={p.match(/suspenden|detienen|dos caminos|renegociamos|libre|devolver/) ? "font-extrabold text-foreground" : ""}>
                                                                    {p}
                                                                </span>
                                                            ))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="pt-4 flex items-center gap-3 text-primary/80">
                                            <div className="h-px flex-grow bg-gradient-to-r from-primary/20 to-transparent" />
                                            <p className="text-sm italic font-bold uppercase tracking-wider whitespace-nowrap">
                                                {step.footer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final CTA section - Redesigned as a Premium Card */}
                <div className="max-w-4xl mx-auto mt-32 relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110 opacity-50" />
                    <div className="relative bg-gradient-to-br from-white to-[#f0f4ff] p-10 md:p-16 rounded-[3rem] shadow-elegant border border-white text-center overflow-hidden">
                        {/* Visual accent */}
                        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full -translate-x-1/2 -translate-y-1/2" />

                        <h4 className="text-3xl md:text-5xl font-black text-foreground mb-8">
                            Tu situación tiene solución
                        </h4>
                        <div className="h-1 w-20 bg-primary mx-auto mb-10 rounded-full" />

                        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                            Si las deudas ya no te dejan avanzar, <br className="hidden md:block" />
                            <strong className="font-extrabold text-primary text-2xl md:text-3xl block mt-4 px-4 py-2 bg-primary/5 rounded-2xl w-fit mx-auto border border-primary/10">
                                actuar a tiempo marca la diferencia.
                            </strong>
                        </p>

                        <div className="flex flex-col items-center gap-8">
                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-soft ring-1 ring-black/5 max-w-md">
                                <div className="p-3 rounded-full bg-primary/10 animate-pulse">
                                    <Phone className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-left text-sm font-bold text-foreground/80 leading-tight">
                                    Agenda una asesoría gratuita y descubre cómo iniciar tu proceso de forma segura y estratégica.
                                </p>
                            </div>

                            <button
                                onClick={() => window.scrollTo({ top: document.getElementById('contact')?.offsetTop || 0, behavior: 'smooth' })}
                                className="group relative inline-flex items-center justify-center px-10 py-5 bg-primary text-white text-2xl font-black rounded-2xl shadow-elegant transition-smooth hover:scale-105 active:scale-95 hover:shadow-2xl overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    Quiero asesoría ahora
                                    <span className="transition-transform group-hover:translate-x-2">👉</span>
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
