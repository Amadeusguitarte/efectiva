"use client";

import Image from "next/image";

import whatsappIcono from "@/assets/images/whatsapp.svg";
import { whatsappUrl } from "@/config/site";
import { registrarEvento } from "@/lib/analytics";

export function BotonWhatsApp() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      onClick={() => registrarEvento("contact", { canal: "whatsapp", ubicacion: "boton_flotante" })}
      className="fixed right-6 bottom-6 z-50 rounded-full drop-shadow-2xl transition-transform duration-300 hover:scale-110 focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none"
    >
      <Image src={whatsappIcono} alt="" className="size-16" unoptimized />
    </a>
  );
}
