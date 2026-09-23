import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Las pruebas del PDF usan JSX de @react-pdf/renderer.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "supabase/tests/**/*.test.ts"],
    // Las pruebas de base de datos arrancan Postgres (PGlite) en memoria.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
