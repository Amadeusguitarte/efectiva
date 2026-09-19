import { Skeleton } from "@/components/ui/skeleton";

export default function CargandoAdmin() {
  return (
    <div className="space-y-6" aria-busy aria-label="Cargando">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
