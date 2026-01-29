import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";
import heroImage from "@/assets/hero-image-family.png";

export const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-start pt-40 md:pt-56 overflow-hidden bg-[#7ec8e3]">
      {/* Background Image - Netflix Style */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Libertad financiera con Insolvencia Efectiva"
          className="w-full h-full object-cover object-[center_top] lg:object-[right_top]"
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 drop-shadow-2xl">
            Recupera tu libertad financiera
          </h1>

          <p className="text-lg md:text-xl mb-8 text-white/95 drop-shadow-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 max-w-3xl font-light leading-relaxed tracking-wide">
            Con más de 16 años de experiencia, ayudamos a personas naturales y pequeños empresarios a resolver sus deudas de forma <strong className="font-extrabold text-white">legal, ordenada y definitiva</strong>, a través de la Ley de Insolvencia en Colombia.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Button
              size="lg"
              className="w-full sm:w-auto text-lg bg-primary hover:bg-primary/90 shadow-2xl"
              onClick={() => window.scrollTo({ top: document.getElementById('contact')?.offsetTop || 0, behavior: 'smooth' })}
            >
              <Phone className="mr-2 h-5 w-5" />
              Agendar una llamada gratuita
            </Button>


          </div>

          <div className="mt-10 flex items-center gap-8 text-sm text-white/90 animate-in fade-in duration-700 delay-500">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="font-medium">100% Legal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="font-medium">Consulta gratuita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="font-medium">Más de 16 años de experiencia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade to White */}
    </section>
  );
};