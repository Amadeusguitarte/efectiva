import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "supabase/tests/**/*.test.ts"],
    // Las pruebas de base de datos arrancan Postgres (PGlite) en memoria.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
