import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_SITE_URL;
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/politica-de-privacidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terminos-y-condiciones`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/aviso-legal`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
