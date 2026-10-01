import { CLASES } from "@/lib/diagnostico/catalogos";
import { cn } from "cn";

import { FONDO_CLASE } from "./columnas";

const CELDA = "border border-hoja-cuadricula px-2 py-1.5 align-top";

const FUENTES = [
  {
    fuente: "Ley 2445 de 2025",
    url: "https://www.secretariasenado.gov.co/senado/basedoc/ley_2445_2025.html",
  },
  {
    fuente: "Código Civil – prelación",
    url: "https://www.secretariasenado.gov.co/senado/basedoc/codigo_civil_pr077.html",
  },
  {
    fuente: "CGP – insolvencia",
    url: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr018.html",
  },
];

/** Hoja «Guía 5 Clases» del Excel: prelación de créditos para clasificar cada obligación. */
export function GuiaClases() {
  return (
    <div className="grid gap-6 p-4 text-[14px] text-hoja-texto">
      <h2 className="bg-hoja-titulo px-3 py-2 text-center text-lg font-bold text-white">
        GUÍA DE PRELACIÓN DE CRÉDITOS – LEY 2445 DE 2025 / CÓDIGO CIVIL
      </h2>
      <table className="w-full min-w-[60rem] table-fixed border-collapse">
        <colgroup>
          <col className="w-28" />
          <col />
          <col />
          <col />
          <col className="w-56" />
          <col className="w-48" />
        </colgroup>
        <thead>
          <tr className="bg-hoja-encabezado text-white">
            {[
              "CLASE",
              "QUÉ INCLUYE",
              "EJEMPLOS PARA DIAGNÓSTICO",
              "CLAVE DE CLASIFICACIÓN",
              "BASE LEGAL",
              "TRATAMIENTO",
            ].map((titulo) => (
              <th key={titulo} scope="col" className={cn(CELDA, "text-center font-bold")}>
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CLASES.filter((c) => c.valor !== "por_verificar").map((clase) => (
            <tr key={clase.valor} className="bg-hoja-fondo">
              <th
                scope="row"
                className={cn(CELDA, "text-center font-bold", FONDO_CLASE[clase.valor])}
              >
                {clase.etiquetaPropuesta}
              </th>
              <td className={CELDA}>{clase.incluye}</td>
              <td className={CELDA}>{clase.ejemplos}</td>
              <td className={CELDA}>{clase.clave}</td>
              <td className={CELDA}>{clase.baseLegal}</td>
              <td className={CELDA}>{clase.tratamiento}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="w-full max-w-4xl table-fixed border-collapse">
        <colgroup>
          <col className="w-56" />
          <col />
        </colgroup>
        <thead>
          <tr className="bg-hoja-titulo text-left text-white">
            <th scope="col" className={cn(CELDA, "font-bold")}>
              FUENTE
            </th>
            <th scope="col" className={cn(CELDA, "font-bold")}>
              URL
            </th>
          </tr>
        </thead>
        <tbody>
          {FUENTES.map((f) => (
            <tr key={f.url} className="bg-hoja-fondo">
              <td className={CELDA}>{f.fuente}</td>
              <td className={cn(CELDA, "break-all")}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-hoja-vineta underline underline-offset-2"
                >
                  {f.url}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
