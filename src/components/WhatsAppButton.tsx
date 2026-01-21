import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const WhatsAppButton = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = "573001234567"; // Colombian WhatsApp number
    const message = encodeURIComponent("Hola, necesito información sobre la Ley de Insolvencia");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      size="icon"
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 z-50 bg-[#25D366] p-0 overflow-hidden flex items-center justify-center border-2 border-white"
      aria-label="Contactar por WhatsApp"
    >
      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-full w-full object-cover" />
    </Button>
  );
};