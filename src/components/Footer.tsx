import { Instagram, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Insolvencia Efectiva</h3>
            <p className="text-background/80 mb-4">
              Más de 16 años ayudando a colombianos a recuperar su libertad financiera
              a través de la Ley de Insolvencia. Soluciones legales especializadas con
              resultados comprobados.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/insolvencia_efectiva/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-smooth"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-background/80">
              <li>
                <a href="#servicios" className="hover:text-background transition-smooth">
                  Servicios
                </a>
              </li>
              <li>
                <a href="#proceso" className="hover:text-background transition-smooth">
                  Cómo Funciona
                </a>
              </li>
              <li>
                <a href="#testimonios" className="hover:text-background transition-smooth">
                  Testimonios
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-background transition-smooth">
                  Preguntas Frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-background/80 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>+57 300 123 4567</p>
                  <p>+57 601 234 5678</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>info@insolvenciaefectiva.com</p>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Calle 72 #10-51, Oficina 501<br />Bogotá, Colombia</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/60">
            <p>
              © {new Date().getFullYear()} Insolvencia Efectiva. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <a href="/politica-privacidad" className="hover:text-background transition-smooth">
                Política de Privacidad
              </a>
              <a href="/terminos" className="hover:text-background transition-smooth">
                Términos y Condiciones
              </a>
              <a href="/aviso-legal" className="hover:text-background transition-smooth">
                Aviso Legal
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};