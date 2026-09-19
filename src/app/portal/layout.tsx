import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/marca/logo";
import { MenuUsuario } from "@/components/plataforma/menu-usuario";
import { enlacesLegales } from "@/config/navegacion";
import { siteConfig } from "@/config/site";
import { requerirCliente } from "@/lib/auth/sesion";

export const metadata: Metadata = {
  title: { default: "Mi proceso", template: "%s | Insolvencia Efectiva" },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const usuario = await requerirCliente();

  return (
    <div className="flex min-h-dvh flex-col bg-surface-soft">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Logo href="/portal" />
          <MenuUsuario
            nombre={usuario.nombre}
            email={usuario.email}
            avatarUrl={usuario.avatarUrl}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:py-10">{children}</main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          <nav aria-label="Enlaces legales">
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {enlacesLegales.map((enlace) => (
                <li key={enlace.href}>
                  <Link href={enlace.href} className="hover:text-foreground">
                    {enlace.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
