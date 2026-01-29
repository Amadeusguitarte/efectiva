import React, { useEffect, useState, useRef } from "react";
import { Search, ShieldCheck, Handshake, Heart, ArrowRight } from "lucide-react";

const steps = [
    {
        number: "1",
        title: "Analizamos tu situación financiera",
        content: (
            <div className="space-y-4">
                <p className="text-lg text-muted-foreground leading-relaxed">
                    Estudiamos tu caso en detalle: deudas, ingresos, procesos judiciales y capacidad real de pago.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    Con esta información definimos <strong className="font-bold text-foreground">la estrategia legal más conveniente para ti</strong>, sin improvisaciones.
                </p>
                <p className="text-lg text-primary font-bold italic pt-2">
                    👉 Nada genérico. Todo adaptado a tu realidad.
                </p>
            </div>
        ),
        icon: Search
    },
    {
        number: "2",
        title: "Activamos tu protección legal",
        content: (
            <div className="space-y-4">
                <p className="text-lg text-muted-foreground leading-relaxed font-bold">
                    Una vez iniciado el proceso de insolvencia:
                </p>
                <ul className="space-y-3">
                    {[
                        "Se suspenden embargos y procesos ejecutivos",
                        "Se detienen intereses y cobros abusivos",
                        "Recuperas estabilidad mientras avanzamos en la solución"
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-lg text-muted-foreground">
                            <span className="text-foreground font-bold mt-1">•</span>
                            <span className="font-bold text-foreground/90">{item}</span>
                        </li>
                    ))}
                </ul>
                <p className="text-lg text-muted-foreground leading-relaxed pt-2">
                    La ley te protege desde el inicio del trámite.
                </p>
            </div>
        ),
        icon: ShieldCheck
    },
    {
        number: "3",
        title: "Negociamos o liquidamos, según tu caso",
        content: (
            <div className="space-y-4">
                <p className="text-lg text-muted-foreground leading-relaxed">
                    La Ley de Insolvencia ofrece <strong className="font-bold text-foreground">dos caminos legales</strong>, y te guiamos en el más conveniente:
                </p>
                <ul className="space-y-4 pl-1">
                    <li className="flex items-start gap-4">
                        <span className="text-foreground font-bold mt-1.5">•</span>
                        <p className="text-lg text-muted-foreground">
                            <strong className="font-bold text-foreground">Acuerdo de pago:</strong> renegociamos tus deudas con reducción de intereses y cuotas ajustadas a tu capacidad real.
                        </p>
                    </li>
                    <li className="flex items-start gap-4">
                        <span className="text-foreground font-bold mt-1.5">•</span>
                        <p className="text-lg text-muted-foreground">
                            <strong className="font-bold text-foreground">Liquidación patrimonial:</strong> entregas tus bienes (si los tienes) y quedas <strong className="font-bold text-foreground">libre de todas tus obligaciones.</strong>
                        </p>
                    </li>
                </ul>
                <p className="text-lg text-muted-foreground italic pl-8">
                    Si no tienes bienes, también puedes acceder a este mecanismo.
                </p>
            </div>
        ),
        icon: Handshake
    },
    {
        number: "4",
        title: "Acompañamiento integral hasta el final",
        content: (
            <div className="space-y-4">
                <p className="text-lg text-muted-foreground leading-relaxed">
                    No te dejamos solo en ningún momento.
                </p>
                <ul className="space-y-3">
                    {[
                        "Te representamos ante acreedores y autoridades",
                        "Gestionamos audiencias y trámites",
                        "Te explicamos cada etapa con claridad"
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-lg text-muted-foreground">
                            <span className="text-foreground font-bold mt-1">•</span>
                            {item}
                        </li>
                    ))}
                </ul>
                <p className="text-lg text-muted-foreground leading-relaxed pt-2">
                    Nuestro objetivo no es solo resolver tus deudas, sino <strong className="font-bold text-foreground">devolver tu tranquilidad financiera y personal.</strong>
                </p>
            </div>
        ),
        icon: Heart
    }
];

export const UnifiedProcess = () => {
    const [activeStep, setActiveStep] = useState(0);
    const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = stepRefs.current.indexOf(entry.target as HTMLDivElement);
                        if (index !== -1) {
                            setActiveStep(index);
                        }
                    }
                });
            },
            { threshold: 0.6, rootMargin: "-10% 0px -40% 0px" }
        );

        stepRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <section id="how-it-works" className="py-24 bg-[#f8f9fc] relative">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

                    {/* Left Column - Sticky Context */}
                    <div className="lg:w-[45%] lg:sticky lg:top-32 self-start space-y-8 mb-12 lg:mb-0">
                        <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight tracking-tight">
                            ¿Cómo funciona el proceso de insolvencia con nosotros?
                        </h2>

                        <div className="space-y-6">
                            <div className="space-y-6 bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-border shadow-soft">
                                <p className="text-lg md:text-xl font-bold text-primary leading-tight">
                                    Acógete a la Ley de Insolvencia (Ley 1564 de 2012 – Insolvencia de Persona Natural)
                                </p>

                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Cuando las deudas se acumulan y ya no es posible ponerse al día, <strong className="font-bold text-foreground">la ley colombiana ofrece una salida legal, ordenada y definitiva</strong> para recuperar el control financiero.
                                </p>

                                <p className="text-base text-muted-foreground leading-relaxed">
                                    En <strong className="font-bold text-foreground">Insolvencia Efectiva</strong> utilizamos el régimen de insolvencia de persona natural para ayudarte a <strong className="font-bold">detener cobros, suspender embargos y reorganizar tus obligaciones</strong> bajo condiciones reales y justas.
                                </p>

                                <div className="border-l-4 border-primary pl-4 py-1.5 bg-primary/5 rounded-r-xl">
                                    <p className="text-base text-muted-foreground leading-relaxed italic">
                                        Este no es un atajo ni una promesa vacía: es un <strong className="font-bold text-foreground">proceso legal respaldado por la ley</strong>, diseñado para personas que necesitan empezar de nuevo.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={() => window.scrollTo({ top: document.getElementById('contact')?.offsetTop || 0, behavior: 'smooth' })}
                                    className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold text-lg rounded-2xl shadow-soft hover:shadow-elegant hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                >
                                    Quiero asesoría ahora
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Scrollable Cards + Progress Indicator */}
                    <div className="lg:w-[50%] flex gap-4 md:gap-12 ml-auto">

                        {/* Scrollable Cards Container */}
                        <div className="flex-grow space-y-20 pb-32">
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    ref={(el) => (stepRefs.current[index] = el)}
                                    className={`transition-all duration-700 transform ${activeStep === index ? "opacity-100 scale-100" : "opacity-30 scale-95 blur-[1px]"
                                        }`}
                                >
                                    <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-soft border border-border hover:shadow-elegant transition-smooth overflow-hidden">
                                        <div className="flex flex-col gap-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-primary font-bold italic text-xl">
                                                        {step.number}
                                                    </span>
                                                    <h3 className="text-xl md:text-2xl font-bold text-primary">
                                                        {step.title}
                                                    </h3>
                                                </div>
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                                    <step.icon className="h-6 w-6" />
                                                </div>
                                            </div>

                                            <div className="h-px bg-border/50 w-full" />

                                            <div className="text-muted-foreground">
                                                {step.content}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Final Outcome Card */}
                            <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-elegant border-2 border-primary/20 space-y-8 text-center">
                                <h4 className="text-2xl md:text-3xl font-bold text-foreground">
                                    Tu situación tiene solución
                                </h4>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Si las deudas ya no te dejan avanzar, <strong className="font-bold text-foreground">actuar a tiempo marca la diferencia.</strong>
                                </p>
                                <p className="text-lg text-muted-foreground">
                                    📞 Agenda una asesoría gratuita y descubre cómo iniciar tu proceso de insolvencia de forma segura, legal y estratégica.
                                </p>
                                <div className="pt-4">
                                    <button
                                        onClick={() => window.scrollTo({ top: document.getElementById('contact')?.offsetTop || 0, behavior: 'smooth' })}
                                        className="w-full sm:w-auto px-10 py-5 bg-primary text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-elegant hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
                                    >
                                        👉 Quiero asesoría ahora
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Vertical Progress Indicator (Sticky) */}
                        <div className="hidden xl:flex flex-col items-center sticky top-32 h-[60vh] pl-4 md:pl-8 flex-shrink-0">
                            <div className="relative flex flex-col items-center h-full py-4">
                                {/* Background line */}
                                <div className="absolute top-0 bottom-0 w-1 bg-primary/10 rounded-full" />

                                {/* Active step dots */}
                                <div className="flex flex-col justify-between h-full relative z-10 py-2">
                                    {steps.map((_, index) => (
                                        <div key={index} className="relative flex items-center">
                                            <div
                                                className={`w-4 h-4 rounded-full border-2 transition-all duration-500 shadow-sm ${activeStep === index
                                                        ? "bg-primary border-primary scale-150 shadow-primary/30"
                                                        : "bg-white border-primary/40 scale-100"
                                                    }`}
                                            />

                                            {activeStep === index && (
                                                <div className="absolute left-8 whitespace-nowrap px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-tighter rounded-lg shadow-lg animate-in fade-in slide-in-from-left-4">
                                                    PASO {index + 1}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};
