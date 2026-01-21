import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image - Netflix Style */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Libertad financiera con Insolvencia Efectiva" 
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 drop-shadow-2xl">
            Recupera Tu Libertad Financiera
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 max-w-xl">
            Con más de <strong>16 años de experiencia</strong>, ayudamos a personas y pequeñas empresas a solucionar sus deudas legalmente con la Ley de Insolvencia
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
            
            <Button 
              size="lg" 
              className="w-full sm:w-auto text-lg bg-white/20 text-white border-2 border-white/60 hover:bg-white hover:text-foreground backdrop-blur-md"
              onClick={() => window.open('https://wa.me/573001234567?text=Hola%2C%20necesito%20información%20sobre%20la%20Ley%20de%20Insolvencia', '_blank')}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Hablar por WhatsApp
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-8 text-sm text-white/90 animate-in fade-in duration-700 delay-500">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="font-medium">100% Legal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="font-medium">Consulta Gratis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="font-medium">16 Años de Experiencia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade to White */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};