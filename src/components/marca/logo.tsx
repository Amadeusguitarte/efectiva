import Image from "next/image";
import Link from "next/link";

import isotipo from "@/assets/images/isotipo.png";
import logoBlanco from "@/assets/images/logo-blanco.png";
import { siteConfig } from "@/config/site";
import { cn } from "cn";

type LogoProps = {
  /** "claro" para fondos oscuros (logo completo en blanco); "oscuro" para fondos claros. */
  variante?: "claro" | "oscuro";
  href?: "/" | "/admin" | "/portal";
  className?: string;
  prioridad?: boolean;
};

export function Logo({ variante = "oscuro", href = "/", className, prioridad }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex shrink-0 items-center gap-2.5", className)}
      aria-label={`${siteConfig.name}, ir al inicio`}
    >
      {variante === "claro" ? (
        <Image src={logoBlanco} alt="" priority={prioridad} className="h-10 w-auto" sizes="220px" />
      ) : (
        <>
          <Image src={isotipo} alt="" priority={prioridad} className="h-8 w-auto" sizes="40px" />
          <span className="text-[0.95rem] leading-none font-extrabold tracking-tight text-navy uppercase">
            Insolvencia <span className="text-primary">Efectiva</span>
          </span>
        </>
      )}
    </Link>
  );
}
