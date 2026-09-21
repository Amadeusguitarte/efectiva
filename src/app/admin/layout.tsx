import type { Metadata } from "next";

import { BarraLateralAdmin, MenuMovilAdmin } from "@/components/admin/navegacion-admin";
import { MenuUsuario } from "@/components/plataforma/menu-usuario";
import { requerirAdmin } from "@/lib/auth/sesion";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel · Insolvencia Efectiva" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const usuario = await requerirAdmin();

  return (
    <div className="min-h-dvh bg-surface-soft lg:grid lg:grid-cols-[16rem_1fr]">
      <div className="hidden border-r bg-background lg:block print:hidden">
        <aside className="sticky top-0 h-dvh">
          <BarraLateralAdmin />
        </aside>
      </div>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur md:px-8 print:hidden">
          <div className="flex items-center gap-2">
            <MenuMovilAdmin />
            <p className="text-sm font-medium text-muted-foreground">Panel de gestión</p>
          </div>
          <MenuUsuario
            nombre={usuario.nombre}
            email={usuario.email}
            avatarUrl={usuario.avatarUrl}
            puedeCambiarContrasena
          />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
