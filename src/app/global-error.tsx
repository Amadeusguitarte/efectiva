"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Este archivo reemplaza el layout raíz, así que no dispone de los estilos globales.
  return (
    <html lang="es-CO">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#344256",
          background: "#f8f9fc",
        }}
      >
        <title>Algo salió mal | Insolvencia Efectiva</title>
        <main style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Algo salió mal</h1>
          <p style={{ marginBottom: 24 }}>Tuvimos un problema inesperado. Inténtalo de nuevo.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: "#0073e6",
              color: "white",
              border: 0,
              borderRadius: 10,
              padding: "12px 20px",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
