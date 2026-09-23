import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Railway (Docker): al contenedor solo van los archivos necesarios.
  output: "standalone",
  typedRoutes: true,
  // El generador de PDF usa módulos de Node; se carga desde node_modules sin empaquetar.
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/politica-privacidad", destination: "/politica-de-privacidad", permanent: true },
      { source: "/terminos", destination: "/terminos-y-condiciones", permanent: true },
      { source: "/login", destination: "/ingresar", permanent: true },
    ];
  },
};

export default nextConfig;
