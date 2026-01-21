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
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-elegant hover:scale-110 transition-smooth z-50 bg-[#25D366] hover:bg-[#20BA5A]"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-8 w-8" />
    </Button>
  );
};