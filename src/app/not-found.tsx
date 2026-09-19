import Link from "next/link";

import { Logo } from "@/components/marca/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-surface-soft px-4 text-center">
      <Logo />
      <div className="space-y-3">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Error 404</p>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          No encontramos esta página
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          Es posible que el enlace esté mal escrito o que la página ya no exista.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
