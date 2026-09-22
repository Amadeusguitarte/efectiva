import { z } from "zod";

import { normalizarUrlSitio } from "./url-sitio";

const optional = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("https://insolvenciaefectiva.com"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_GA_ID: optional,
  NEXT_PUBLIC_META_PIXEL_ID: optional,
});

// Las variables NEXT_PUBLIC_* deben leerse de forma explícita para que Next.js las incluya en el bundle.
const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: normalizarUrlSitio(process.env.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
});

if (!parsed.success) {
  throw new Error(
    `Variables de entorno inválidas. Revisa .env.local (ver .env.example):\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
