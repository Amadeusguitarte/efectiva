import { Skeleton } from "@/components/ui/skeleton";

export default function CargandoPortal() {
  return (
    <div className="space-y-6" aria-busy aria-label="Cargando">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-56 rounded-xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
