import type { Metadata } from "next";
import { cookies } from "next/headers";

import { MarcoAdmin } from "@/components/admin/marco-admin";
import { MenuMovilAdmin } from "@/components/admin/navegacion-admin";
import { CampanaNotificaciones } from "@/components/plataforma/campana-notificaciones";
import { MenuUsuario } from "@/components/plataforma/menu-usuario";
import { requerirAdmin } from "@/lib/auth/sesion";
import { obtenerNotificaciones, obtenerResumenCrm } from "@/lib/datos/crm";
import { COOKIE_MENU_ADMIN, leerPreferenciaMenu } from "@/lib/preferencias-menu";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel · Insolvencia Efectiva" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const usuario = await requerirAdmin();
  const [notificaciones, almacenCookies, resumenCrm] = await Promise.all([
    obtenerNotificaciones(10).catch(() => ({ notificaciones: [], noLeidas: 0 })),
    cookies(),
    obtenerResumenCrm().catch(() => null),
  ]);
  // Contadores rojos del menú, como en Kommo.
  const contadores = {
    chat: resumenCrm?.sinResponderChat ?? 0,
    correo: resumenCrm?.sinResponderCorreo ?? 0,
    tareas: resumenCrm?.tareasVencidas ?? 0,
  };
  // Minimizado y tamaño del menú lateral: se leen aquí para no parpadear al recargar.
  const preferenciaMenu = leerPreferenciaMenu(almacenCookies.get(COOKIE_MENU_ADMIN)?.value);

  return (
    <MarcoAdmin
      preferenciaInicial={preferenciaMenu}
      contadores={contadores}
      encabezado={
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur md:px-8 print:hidden">
          <div className="flex items-center gap-2">
            <MenuMovilAdmin contadores={contadores} />
            <p className="text-sm font-medium text-muted-foreground">Panel de gestión</p>
          </div>
          <div className="flex items-center gap-1">
            <CampanaNotificaciones inicial={notificaciones} />
            <MenuUsuario
              nombre={usuario.nombre}
              email={usuario.email}
              avatarUrl={usuario.avatarUrl}
              puedeCambiarContrasena
            />
          </div>
        </header>
      }
    >
      {children}
    </MarcoAdmin>
  );
}
