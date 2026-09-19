import { cn } from "cn";

type EncabezadoPaginaProps = {
  titulo: string;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
  className?: string;
};

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
  className,
}: EncabezadoPaginaProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {titulo}
        </h1>
        {descripcion ? <div className="text-sm text-muted-foreground">{descripcion}</div> : null}
      </div>
      {acciones ? <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div> : null}
    </div>
  );
}
