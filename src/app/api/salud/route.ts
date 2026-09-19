// Comprobación de salud para el host: Railway la consulta antes de enrutar
// tráfico a un despliegue nuevo. Es la única ruta sin sesión y no lee datos.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ estado: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
