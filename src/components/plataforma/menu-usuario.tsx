"use client";

import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import Link from "next/link";

import { cerrarSesion } from "@/app/(auth)/acciones";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { iniciales } from "@/lib/formato";

type MenuUsuarioProps = {
  nombre: string;
  email: string;
  avatarUrl: string | null;
  /** Las cuentas del equipo usan contraseña; los clientes entran con Google. */
  puedeCambiarContrasena?: boolean;
};

export function MenuUsuario({
  nombre,
  email,
  avatarUrl,
  puedeCambiarContrasena,
}: MenuUsuarioProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <Avatar className="size-8">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : null}
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {iniciales(nombre)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">{nombre}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
        <span className="sr-only">Abrir menú de usuario</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{nombre}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {puedeCambiarContrasena ? (
          <DropdownMenuItem asChild>
            <Link href="/actualizar-contrasena">
              <KeyRound />
              Cambiar contraseña
            </Link>
          </DropdownMenuItem>
        ) : null}
        <form action={cerrarSesion}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut />
              Cerrar sesión
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
