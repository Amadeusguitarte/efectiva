import { Search, ShieldCheck, Handshake, Heart, Phone, ArrowRight } from "lucide-react";

const steps = [
    {
        number: "01",
        title: "Analizamos tu situación financiera",
        description: "Estudiamos tu caso en detalle: deudas, ingresos, procesos judiciales y capacidad real de pago.",
        highlight: "Definimos la estrategia legal más conveniente para ti, sin improvisaciones.",
        footer: "Nada genérico. Todo adaptado a tu realidad.",
        icon: Search
    },
    {
        number: "02",
        title: "Activamos tu protección legal",
        description: "Iniciamos el proceso y activamos el escudo legal que detiene la presión financiera inmediatamente.",
        bullets: [
            "Se suspenden embargos y procesos ejecutivos",
            "Se detienen intereses y cobros abusivos",
            "Recuperas estabilidad desde el primer día"
        ],
        footer: "La ley te protege desde el inicio del trámite.",
        icon: ShieldCheck
    },
    {
        number: "03",
        title: "Negociamos o liquidamos",
        description: "Guiamos tu caso por el camino legal más favorable según tu patrimonio y deudas.",
        bullets: [
            "Acuerdo de pago: Renegociamos cuotas a tu capacidad real.",
            "Liquidación patrimonial: Quedas libre de todas tus obligaciones."
        ],
        footer: "Buscamos siempre tu descarga financiera total.",
        icon: Handshake
    },
    {
        number: "04",
        title: "Acompañamiento integral",
        description: "No te dejamos solo. Representamos tus intereses ante acreedores y jueces hasta el cierre final.",
        footer: "Devolvemos tu tranquilidad financiera y personal.",
        icon: Heart
    }
];

export const UnifiedProcess = () => {
    return (
        <section id="how-it-works" className="py-24 bg-[#f8f9fc] relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row gap-16 items-start">

                    {/* Left Column - Sticky Context */}
                    <div className="lg:w-2/5 lg:sticky lg:top-32 space-y-8">
                        <div className="space-y-4">
                            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold uppercase tracking-wider">
                                Nuestro Proceso
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black text-foreground leading-[1.1]">
                                ¿Cómo funciona el proceso con nosotros?
                            </h2>
                        </div>

                        <div className="p-8 bg-white rounded-[2rem] shadow-soft border border-white ring-1 ring-black/5 space-y-6">
                            <div className="flex gap-4 items-start">
                                <div className="h-full w-1.5 bg-primary rounded-full self-stretch flex-shrink-0" />
                                <p className="text-lg font-bold text-foreground/80 leading-relaxed">
                                    Acógete a la Ley de Insolvencia (Ley 1564 de 2012 – Insolvencia de Persona Natural)
                                </p>
                            </div>

                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Cuando las deudas se acumulan, <strong className="font-extrabold text-foreground">la ley colombiana ofrece una salida legal, ordenada y definitiva</strong> para recuperar el control.
                            </p>

                            <div className="pt-4">
                                <button
                                    onClick={() => window.scrollTo({ top: document.getElementById('contact')?.offsetTop || 0, behavior: 'smooth' })}
                                    className="flex items-center gap-2 text-primary font-black text-lg group"
                                >
                                    Quiero una asesoría gratuita
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Scrollable Steps */}
                    <div className="lg:w-3/5 space-y-12">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="group relative bg-white p-10 md:p-12 rounded-[2.5rem] shadow-soft border border-white transition-all duration-500 hover:shadow-elegant hover:-translate-y-2 ring-1 ring-black/5"
                            >
                                {/* Step Badge */}
                                <div className="absolute -top-4 -right-4 md:right-10 px-6 py-2 bg-primary text-white text-sm font-black rounded-xl shadow-lg transform group-hover:scale-110 transition-transform">
                                    PASO {step.number}
                                </div>

                                <div className="flex flex-col gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                            <step.icon className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black text-foreground">
                                            {step.title}
                                        </h3>
                                    </div>

                                    <div className="space-y-6">
                                        <p className="text-xl text-muted-foreground leading-relaxed">
                                            {step.description}
                                        </p>

                                        {step.highlight && (
                                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 border-l-4 border-l-primary">
                                                <p className="text-foreground italic font-medium">
                                                    {step.highlight}
                                                </p>
                                            </div>
                                        )}

                                        {step.bullets && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                {step.bullets.map((bullet, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8f9fc] border border-border/50 shadow-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                                                        <span className="text-sm md:text-base font-bold text-foreground/80 leading-snug">
                                                            {bullet}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
                                            <p className="text-sm font-extrabold uppercase tracking-widest text-primary/60 italic">
                                                {step.footer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Final Outcome Card */}
                        <div className="p-12 bg-gradient-to-br from-primary to-primary-foreground rounded-[3rem] shadow-elegant text-white text-center space-y-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative z-10 space-y-6">
                                <h4 className="text-3xl md:text-4xl font-black">
                                    Tu situación tiene solución
                                </h4>
                                <p className="text-xl opacity-90 leading-relaxed max-w-xl mx-auto">
                                    Si las deudas ya no te dejan avanzar, <strong className="text-white underline underline-offset-8 decoration-white/30">actuar a tiempo</strong> marca la diferencia.
                                </p>
                                <div className="pt-4">
                                    <button
                                        onClick={() => window.scrollTo({ top: document.getElementById('contact')?.offsetTop || 0, behavior: 'smooth' })}
                                        className="px-10 py-5 bg-white text-primary text-xl font-black rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Agendar asesoría ahora 👉
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
