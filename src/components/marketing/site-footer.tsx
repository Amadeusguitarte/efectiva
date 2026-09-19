import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { InstagramIcon } from "@/components/iconos/instagram";
import { EnlaceSeccion } from "@/components/marketing/enlace-seccion";
import { enlacesLegales, enlacesPie } from "@/config/navegacion";
import { siteConfig, yearsOfExperience } from "@/config/site";

export function SiteFooter() {
  const { contact, social } = siteConfig;

  return (
    <footer className="bg-navy py-12 text-white">
      <div className="container-page px-4">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="mb-4 text-2xl font-bold">{siteConfig.name}</p>
            <p className="mb-4 max-w-md text-white/80">
              Más de {yearsOfExperience()} años ayudando a colombianos a recuperar su libertad
              financiera a través de la Ley de Insolvencia. Soluciones legales especializadas con
              resultados comprobados.
            </p>
            <a
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              aria-label="Instagram de Insolvencia Efectiva"
            >
              <InstagramIcon className="size-5" />
            </a>
          </div>

          <nav aria-label="Enlaces rápidos">
            <h2 className="mb-4 text-lg font-semibold">Enlaces rápidos</h2>
            <ul className="space-y-2 text-white/80">
              {enlacesPie.map((enlace) => (
                <li key={enlace.seccion}>
                  <EnlaceSeccion
                    seccion={enlace.seccion}
                    className="transition-colors hover:text-white"
                  >
                    {enlace.nombre}
                  </EnlaceSeccion>
                </li>
              ))}
              <li>
                <Link href="/ingresar" className="transition-colors hover:text-white">
                  Portal de clientes
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 text-lg font-semibold">Contacto</h2>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0" />
                <a href={`tel:${contact.phoneE164}`} className="hover:text-white">
                  {contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0" />
                <a href={`mailto:${contact.email}`} className="break-all hover:text-white">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {contact.city}, {contact.country}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-white/60 md:flex-row">
            <p>
              © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
            </p>
            <nav aria-label="Enlaces legales">
              <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                {enlacesLegales.map((enlace) => (
                  <li key={enlace.href}>
                    <Link href={enlace.href} className="transition-colors hover:text-white">
                      {enlace.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
