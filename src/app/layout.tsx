import type { Metadata, Viewport } from "next";
import { Inter, PT_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { siteConfig, yearsOfExperience } from "@/config/site";
import { env } from "@/lib/env";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Tipografía del CRM del panel (la misma de Kommo, que el equipo ya conoce). */
const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-sans",
  display: "swap",
  preload: false,
});

const titulo = `${siteConfig.name} | ${siteConfig.shortDescription} - ${yearsOfExperience()} años de experiencia`;

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: titulo,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: titulo,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: titulo,
    description: siteConfig.description,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0073e6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CO"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${ptSans.variable}`}
    >
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
