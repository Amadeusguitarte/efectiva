import { siteConfig } from "@/config/site";

type PaginaLegalProps = {
  titulo: string;
  children: React.ReactNode;
};

/** Plantilla de lectura para las páginas legales. */
export function PaginaLegal({ titulo, children }: PaginaLegalProps) {
  return (
    <article className="bg-surface-soft pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4">
        <header className="mb-10 border-b pb-8">
          <p className="mb-2 text-sm font-semibold tracking-wide text-primary uppercase">
            {siteConfig.name}
          </p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">{titulo}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última actualización: {siteConfig.legal.politicaDatosFecha}
          </p>
        </header>
        <div className="space-y-4 leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline [&_h2]:pt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_li]:pl-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </div>
    </article>
  );
}

/** Identificación del responsable. Muestra solo los datos que estén configurados. */
export function DatosResponsable() {
  const { legal, contact, name } = siteConfig;
  return (
    <ul>
      <li>
        <strong>Responsable:</strong> {legal.razonSocial || name}
      </li>
      {legal.nit ? (
        <li>
          <strong>NIT:</strong> {legal.nit}
        </li>
      ) : null}
      <li>
        <strong>Domicilio:</strong> {legal.direccion || `${contact.city}, ${contact.country}`}
      </li>
      <li>
        <strong>Correo electrónico:</strong> <a href={`mailto:${contact.email}`}>{contact.email}</a>
      </li>
      <li>
        <strong>Teléfono:</strong> {contact.phoneDisplay}
      </li>
    </ul>
  );
}
