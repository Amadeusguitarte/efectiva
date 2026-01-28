import React, { useEffect, useState, useRef } from "react";
import { Search, ShieldCheck, Handshake, Heart, ArrowRight, CheckCircle2 } from "lucide-react";

const steps = [
    {
        number: "1",
        title: "Análisis Inicial",
        description: "Estudiamos tu caso en detalle: deudas, ingresos, procesos judiciales y tu capacidad real de pago.",
        highlight: "Definimos la mejor estrategia legal para ti.",
        icon: Search
    },
    {
        number: "2",
        title: "Protección Legal",
        description: "Iniciamos el proceso y activamos el escudo que detiene la presión financiera inmediatamente.",
        bullets: [
            "Suspensión de embargos",
            "Frenado de intereses abusivos",
            "Protección de tus bienes"
        ],
        icon: ShieldCheck
    },
    {
        number: "3",
        title: "Negociación Estratégica",
        description: "Llevamos tu caso por el camino legal más favorable: acuerdo de pago o descarga total.",
        bullets: [
            "Acuerdo de pago ajustado",
            "Liquidación con descarga de deudas"
        ],
        icon: Handshake
    },
    {
        number: "4",
        title: "Libertad Financiera",
        description: "Acompañamiento hasta el cierre final. Recuperas la tranquilidad y el control de tu vida.",
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
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">

                    {/* Left Column - Sticky Context */}
                    <div className="lg:w-[45%] lg:sticky lg:top-40 self-start space-y-10 mb-12 lg:mb-0">
                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-5xl font-black text-primary leading-[1.1] tracking-tight uppercase">
                                ¿CÓMO FUNCIONA EL PROCESO DE INSOLVENCIA CON NOSOTROS?
                            </h2>
                        </div>

                        <div className="space-y-8 max-w-xl">
                            <div className="space-y-6 bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-white shadow-soft">
                                <p className="text-lg md:text-xl font-medium text-primary/80">
                                    Acógete a la Ley de Insolvencia (Ley 1564 de 2012 – Insolvencia de Persona Natural)
                                </p>

                                <p className="text-xl text-foreground/90 leading-relaxed">
                                    Cuando las deudas se acumulan y ya no es posible ponerse al día, <strong className="font-black text-foreground">la ley colombiana ofrece una salida legal, ordenada y definitiva</strong> para recuperar el control financiero.
                                </p>

                                <p className="text-lg text-foreground/80 leading-relaxed">
                                    En <strong className="text-primary font-bold">Insolvencia Efectiva</strong> utilizamos el régimen de insolvencia de persona natural para ayudarte a <strong className="font-bold">detener cobros, suspender embargos y reorganizar tus obligaciones</strong> bajo condiciones reales y justas.
                                </p>

                                <p className="text-lg text-foreground/80 leading-relaxed border-l-4 border-primary pl-6 py-2 italic bg-primary/5 rounded-r-xl">
                                    Este no es un atajo ni una promesa vacía: es un <strong className="font-bold">proceso legal respaldado por la ley</strong>, diseñado para personas que necesitan empezar de nuevo.
                                </p>
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => window.scrollTo({ top: document.getElementById('contact')?.offsetTop || 0, behavior: 'smooth' })}
                                    className="px-8 py-5 bg-primary text-white font-black text-lg rounded-2xl shadow-elegant hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                >
                                    Agendar asesoría ahora
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Right Column - Scrollable Cards + Progress Indicator */}
                    <div className="lg:w-[60%] flex gap-6 md:gap-12">

                        {/* Scrollable Cards Container */}
                        <div className="flex-grow space-y-24 pb-32">
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    ref={(el) => (stepRefs.current[index] = el)}
                                    className={`transition-all duration-700 transform ${activeStep === index ? "opacity-100 scale-100" : "opacity-40 scale-95 blur-[1px]"
                                        }`}
                                >
                                    <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-soft border border-white ring-1 ring-black/5 relative group hover:shadow-elegant overflow-hidden">
                                        {/* Floating Icon */}
                                        <div className="absolute top-8 right-8 p-4 rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white group-hover:rotate-6">
                                            <step.icon className="h-10 w-10 md:h-12 md:w-12" />
                                        </div>

                                        <div className="space-y-8 pr-12">
                                            <div className="space-y-2">
                                                <span className="text-primary font-black uppercase tracking-widest text-sm">
                                                    PASO {step.number}*
                                                </span>
                                                <h3 className="text-3xl md:text-5xl font-black text-foreground leading-[1.1]">
                                                    {step.title}
                                                </h3>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <p className="text-sm font-black text-foreground uppercase tracking-wider opacity-60">01 Descripción</p>
                                                    <p className="text-xl text-muted-foreground leading-relaxed">
                                                        {step.description}
                                                    </p>
                                                </div>

                                                {(step.bullets || step.highlight) && (
                                                    <div className="space-y-4 pt-4">
                                                        <p className="text-sm font-black text-foreground uppercase tracking-wider opacity-60">02 Detalle</p>
                                                        {step.highlight && (
                                                            <p className="text-lg font-bold text-foreground bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                                                {step.highlight}
                                                            </p>
                                                        )}
                                                        {step.bullets && (
                                                            <ul className="space-y-3">
                                                                {step.bullets.map((bullet, i) => (
                                                                    <li key={i} className="flex items-start gap-3 text-lg text-muted-foreground">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                                                                        {bullet}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Vertical Progress Indicator (Sticky) */}
                        <div className="hidden md:flex flex-col items-center sticky top-36 h-[60vh]">
                            <div className="relative flex flex-col items-center h-full py-4">
                                {/* Background line */}
                                <div className="absolute top-0 bottom-0 w-1 bg-primary/10 rounded-full" />

                                {/* Active step dots */}
                                <div className="flex flex-col justify-between h-full relative z-10 py-2">
                                    {steps.map((_, index) => (
                                        <div key={index} className="relative flex items-center">
                                            {/* Step Indicator Dot */}
                                            <div
                                                className={`w-4 h-4 rounded-full border-2 transition-all duration-500 shadow-sm ${activeStep === index
                                                    ? "bg-primary border-primary scale-150 shadow-primary/30"
                                                    : "bg-white border-primary/40 scale-100"
                                                    }`}
                                            />

                                            {/* Step Label (Paso X) appearing on the left of the dot when active */}
                                            {activeStep === index && (
                                                <div className="absolute right-8 whitespace-nowrap px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-tighter rounded-lg shadow-lg animate-in fade-in slide-in-from-right-4">
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
