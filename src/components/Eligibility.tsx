import { CheckCircle2, User, Clock, Scale, ArrowRight } from "lucide-react";

export const Eligibility = () => {
    const criteria = [
        {
            icon: User,
            title: "Persona Natural",
            description: "No comerciante (empleado, independiente, pensionado o servidor público).",
            color: "bg-blue-50 text-blue-600"
        },
        {
            icon: Clock,
            title: "Mora de 90+ Días",
            description: "Dos o más deudas vencidas o procesos de cobro judicial vigentes.",
            color: "bg-amber-50 text-amber-600"
        },
        {
            icon: Scale,
            title: "Deuda del 30%",
            description: "El valor de las deudas en mora representa al menos un tercio de tus obligaciones.",
            color: "bg-emerald-50 text-emerald-600"
        }
    ];

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                        ¿Quién puede acogerse al proceso de <span className="text-primary italic">insolvencia?</span>
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                        Este mecanismo legal está diseñado para personas que, por su situación financiera actual,
                        <strong className="font-bold text-foreground"> ya no pueden cumplir normalmente con sus obligaciones.</strong>
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full text-primary font-semibold text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        Puedes aplicar si cumples alguna de estas condiciones:
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {criteria.map((item, index) => (
                        <div
                            key={index}
                            className="group p-8 rounded-[2.5rem] bg-white border border-border shadow-soft hover:shadow-elegant hover:-translate-y-2 transition-all duration-500"
                        >
                            <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                <item.icon className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="max-w-3xl mx-auto bg-[#eff6ff] rounded-[3rem] p-8 md:p-12 border border-primary/10 text-center relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <p className="text-lg text-muted-foreground mb-8">
                        Cada caso es distinto. Por eso, antes de iniciar, <strong className="font-bold text-foreground">analizamos tu situación para definir la estrategia legal más conveniente para ti.</strong>
                    </p>

                    <button
                        onClick={() => window.scrollTo({ top: document.getElementById('contact')?.offsetTop || 0, behavior: 'smooth' })}
                        className="w-full sm:w-auto px-10 py-5 bg-primary text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-elegant hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto group"
                    >
                        Quiero una asesoría gratuita
                        <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                    </button>
                </div>
            </div>
        </section>
    );
};
