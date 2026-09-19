import { Analytics } from "@/components/marketing/analytics";
import { BotonWhatsApp } from "@/components/marketing/boton-whatsapp";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-[60] rounded-md bg-background px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido">{children}</main>
      <SiteFooter />
      <BotonWhatsApp />
      <Analytics />
    </>
  );
}
