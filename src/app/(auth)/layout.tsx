import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/marca/logo";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-surface-blue">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-primary/10 to-transparent"
      />
      <header className="relative container-page flex h-20 items-center justify-between px-4 md:px-6">
        <Logo prioridad />
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Volver al sitio
        </Link>
      </header>
      <main className="relative flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
