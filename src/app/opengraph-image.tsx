import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { siteConfig, yearsOfExperience } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.shortDescription}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const isotipo = await readFile(join(process.cwd(), "src/assets/images/isotipo.png"));
  const isotipoSrc = `data:image/png;base64,${isotipo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "linear-gradient(135deg, #003a75 0%, #0073e6 60%, #3d9bff 100%)",
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 112,
            height: 112,
            borderRadius: 28,
            background: "white",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse no admite next/image */}
          <img src={isotipoSrc} width={76} height={66} alt="" />
        </div>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: 1 }}>
          INSOLVENCIA EFECTIVA
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
          Recupera tu libertad financiera
        </div>
        <div style={{ display: "flex", fontSize: 34, opacity: 0.9 }}>
          Ley de Insolvencia en Colombia · {yearsOfExperience()} años de experiencia · Consulta
          gratuita
        </div>
      </div>
    </div>,
    size,
  );
}
