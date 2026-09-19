"use client";

import {
  Handshake,
  Heart,
  MessageCircle,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { SECCIONES } from "@/config/navegacion";
import { siteConfig, whatsappUrl } from "@/config/site";
import { registrarEvento } from "@/lib/analytics";
import { cn } from "cn";

type Paso = {
  titulo: string;
  icono: LucideIcon;
  contenido: ReactNode;
};

function ItemLista({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-lg text-muted-foreground">
      <span aria-hidden className="mt-1 font-bold text-foreground">
        •
      </span>
      <span>{children}</span>
    </li>
  );
}

const pasos: Paso[] = [
  {
    titulo: "Analizamos tu situación financiera",
    icono: Search,
    contenido: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">
          Estudiamos tu caso en detalle: deudas, ingresos, procesos judiciales y capacidad real de
          pago.
        </p>
        <p className="text-lg leading-relaxed">
          Con esta información definimos{" "}
          <strong className="font-bold text-foreground">
            la estrategia legal más conveniente para ti
          </strong>
          , sin improvisaciones.
        </p>
        <p className="pt-2 text-lg font-bold text-primary italic">
          Nada genérico. Todo adaptado a tu realidad.
        </p>
      </div>
    ),
  },
  {
    titulo: "Activamos tu protección legal",
    icono: ShieldCheck,
    contenido: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed font-bold">
          Una vez iniciado el proceso de insolvencia:
        </p>
        <ul className="space-y-3 font-bold text-foreground/90">
          <ItemLista>Se suspenden embargos y procesos ejecutivos</ItemLista>
          <ItemLista>Se detienen intereses y cobros abusivos</ItemLista>
          <ItemLista>Recuperas estabilidad mientras avanzamos en la solución</ItemLista>
        </ul>
        <p className="pt-2 text-lg leading-relaxed">
          La ley te protege desde el inicio del trámite.
        </p>
      </div>
    ),
  },
  {
    titulo: "Negociamos o liquidamos, según tu caso",
    icono: Handshake,
    contenido: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">
          La Ley de Insolvencia ofrece{" "}
          <strong className="font-bold text-foreground">dos caminos legales</strong>, y te guiamos
          en el más conveniente:
        </p>
        <ul className="space-y-4">
          <ItemLista>
            <strong className="font-bold text-foreground">Acuerdo de pago:</strong> renegociamos tus
            deudas con reducción de intereses y cuotas ajustadas a tu capacidad real.
          </ItemLista>
          <ItemLista>
            <strong className="font-bold text-foreground">Liquidación patrimonial:</strong> entregas
            tus bienes (si los tienes) y quedas{" "}
            <strong className="font-bold text-foreground">libre de todas tus obligaciones.</strong>
          </ItemLista>
        </ul>
        <p className="pl-6 text-lg italic">
          Si no tienes bienes, también puedes acceder a este mecanismo.
        </p>
      </div>
    ),
  },
  {
    titulo: "Acompañamiento integral hasta el final",
    icono: Heart,
    contenido: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">No te dejamos solo en ningún momento.</p>
        <ul className="space-y-3">
          <ItemLista>Te representamos ante acreedores y autoridades</ItemLista>
          <ItemLista>Gestionamos audiencias y trámites</ItemLista>
          <ItemLista>Te explicamos cada etapa con claridad</ItemLista>
        </ul>
        <p className="pt-2 text-lg leading-relaxed">
          Nuestro objetivo no es solo resolver tus deudas, sino{" "}
          <strong className="font-bold text-foreground">
            devolver tu tranquilidad financiera y personal.
          </strong>
        </p>
      </div>
    ),
  },
];

export function Proceso() {
  const [pasoActivo, setPasoActivo] = useState(0);
  const refsPasos = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          const indice = refsPasos.current.indexOf(entrada.target as HTMLLIElement);
          if (indice !== -1) setPasoActivo(indice);
        }
      },
      { threshold: 0.6, rootMargin: "-10% 0px -40% 0px" },
    );

    for (const elemento of refsPasos.current) {
      if (elemento) observer.observe(elemento);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section id={SECCIONES.comoFunciona} className="relative overflow-clip bg-surface-blue py-24">
      <div
        aria-hidden
        className="absolute top-0 right-0 h-1/2 w-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]"
      />

      <div className="relative z-10 container-page px-4">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-20">
          <div className="relative mb-12 lg:mb-0 lg:w-[45%]">
            <div className="space-y-8 pb-12 lg:sticky lg:top-36">
              <h2 className="text-3xl leading-tight font-bold tracking-tight text-foreground md:text-5xl">
                ¿Cómo funciona el proceso de insolvencia con nosotros?
              </h2>

              <div className="space-y-6 rounded-3xl border bg-white/70 p-6 shadow-soft backdrop-blur-md md:p-8">
                <p className="text-lg leading-tight font-bold text-primary md:text-xl">
                  Acógete a la Ley de Insolvencia de Persona Natural No Comerciante (Ley 1564 de
                  2012 y sus modificaciones)
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Cuando las deudas se acumulan y ya no es posible ponerse al día,{" "}
                  <strong className="font-bold text-foreground">
                    la ley colombiana ofrece una salida legal, ordenada y definitiva
                  </strong>{" "}
                  para recuperar el control financiero.
                </p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  En <strong className="font-bold text-foreground">{siteConfig.name}</strong>{" "}
                  utilizamos el régimen de insolvencia de persona natural para ayudarte a{" "}
                  <strong className="font-bold">
                    detener cobros, suspender embargos y reorganizar tus obligaciones
                  </strong>{" "}
                  bajo condiciones reales y justas.
                </p>
                <div className="rounded-r-xl border-l-4 border-primary bg-primary/5 py-1.5 pl-4">
                  <p className="text-base leading-relaxed text-muted-foreground italic">
                    Este no es un atajo ni una promesa vacía: es un{" "}
                    <strong className="font-bold text-foreground">
                      proceso legal respaldado por la ley
                    </strong>
                    , diseñado para personas que necesitan empezar de nuevo.
                  </p>
                </div>
              </div>

              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  registrarEvento("contact", { canal: "whatsapp", ubicacion: "proceso" })
                }
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-soft transition-all hover:scale-105 hover:shadow-elegant active:scale-95 sm:w-auto"
              >
                Quiero asesoría ahora
                <MessageCircle className="size-5" />
              </a>
            </div>
          </div>

          <div className="ml-auto flex items-start gap-4 md:gap-10 lg:w-1/2">
            <div className="min-w-0 grow space-y-20 pb-32">
              <ol className="space-y-20">
                {pasos.map(({ titulo, icono: Icono, contenido }, indice) => {
                  const activo = pasoActivo === indice;
                  return (
                    <li
                      key={titulo}
                      ref={(elemento) => {
                        refsPasos.current[indice] = elemento;
                      }}
                      className={cn(
                        "transition-all duration-700",
                        activo ? "scale-100 opacity-100" : "scale-95 opacity-30 blur-[1px]",
                      )}
                    >
                      <article
                        className={cn(
                          "overflow-hidden rounded-[2rem] border bg-white p-6 transition-all duration-500 md:p-10",
                          activo
                            ? "border-primary/40 shadow-elegant ring-4 ring-primary/5"
                            : "shadow-soft",
                        )}
                      >
                        <div className="flex flex-col gap-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-6">
                              <span className="text-3xl font-black text-primary italic opacity-40 md:text-5xl">
                                {indice + 1}
                              </span>
                              <h3 className="text-xl leading-tight font-bold text-primary md:text-3xl">
                                {titulo}
                              </h3>
                            </div>
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner md:size-20">
                              <Icono className="size-8 md:size-10" />
                            </div>
                          </div>
                          <div className="h-px w-full bg-border/50" />
                          <div className="text-muted-foreground">{contenido}</div>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>

              <div className="min-w-0 space-y-8 rounded-[2rem] border-2 border-primary/20 bg-white p-8 text-center shadow-elegant md:p-10">
                <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                  Tu situación tiene solución
                </h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Si las deudas ya no te dejan avanzar,{" "}
                  <strong className="font-bold text-foreground">
                    actuar a tiempo marca la diferencia.
                  </strong>
                </p>
                <p className="text-lg text-muted-foreground">
                  Agenda una asesoría gratuita y descubre cómo iniciar tu proceso de insolvencia de
                  forma segura, legal y estratégica.
                </p>
                <a
                  href={`#${SECCIONES.agenda}`}
                  className="mx-auto inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-10 py-5 text-xl font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-elegant active:scale-95 sm:w-auto"
                >
                  Agendar mi llamada gratuita
                </a>
              </div>
            </div>

            <div
              aria-hidden
              className="sticky top-32 hidden h-[60vh] shrink-0 flex-col items-center pl-4 md:pl-8 xl:flex"
            >
              <div className="relative flex h-full flex-col items-center py-4">
                <div className="absolute inset-y-0 w-1 rounded-full bg-primary/10" />
                <div className="relative z-10 flex h-full flex-col justify-between py-2">
                  {pasos.map(({ titulo }, indice) => (
                    <div key={titulo} className="relative flex items-center">
                      <div
                        className={cn(
                          "size-4 rounded-full border-2 shadow-sm transition-all duration-500",
                          pasoActivo === indice
                            ? "scale-150 border-primary bg-primary shadow-primary/30"
                            : "scale-100 border-primary/40 bg-white",
                        )}
                      />
                      {pasoActivo === indice ? (
                        <div className="absolute left-8 animate-in rounded-lg bg-primary px-4 py-2 text-[10px] font-bold tracking-tighter whitespace-nowrap text-primary-foreground uppercase shadow-lg fade-in slide-in-from-left-4">
                          Paso {indice + 1}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
