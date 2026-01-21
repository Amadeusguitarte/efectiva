
export const WhatsAppButton = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = "573195420600"; // Colombian WhatsApp number
    const message = encodeURIComponent("Hola, necesito información sobre la Ley de Insolvencia");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 cursor-pointer hover:scale-110 transition-transform duration-300 drop-shadow-2xl"
      aria-label="Contactar por WhatsApp"
      role="button"
      tabIndex={0}
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="WhatsApp"
        className="h-16 w-16 filter drop-shadow-md"
      />
    </div>
  );
};