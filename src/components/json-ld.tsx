type JsonLdProps = {
  datos: Record<string, unknown>;
};

/** Datos estructurados (schema.org). Escapa "<" para evitar inyección de HTML. */
export function JsonLd({ datos }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  );
}
