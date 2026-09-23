/* eslint-disable jsx-a11y/alt-text -- <Image> de react-pdf no es un <img> del DOM */
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { siteConfig } from "@/config/site";
import { formatearPesos } from "@/lib/formato";

import type { ContenidoPropuesta } from "../contenido";
import { FRASES_EN_NEGRITA, TITULOS_SECCIONES } from "../textos-fijos";
import { ENCABEZADO_PROPUESTA, PIE_PROPUESTA } from "./recursos";

/**
 * Propuesta legal en PDF con el formato de la plantilla oficial: encabezado y pie con la marca,
 * tabla de acreencias y las seis secciones. Se renderiza en el servidor con @react-pdf/renderer
 * (fuente Helvetica incorporada, sin archivos externos).
 */

// El separador silábico de react-pdf es para inglés; en español es mejor no partir palabras.
Font.registerHyphenationCallback((palabra) => [palabra]);

const ANCHO_PAGINA = 595.28; // A4 en puntos
const ALTO_ENCABEZADO = (ANCHO_PAGINA * ENCABEZADO_PROPUESTA.alto) / ENCABEZADO_PROPUESTA.ancho;
const ALTO_PIE = (ANCHO_PAGINA * PIE_PROPUESTA.alto) / PIE_PROPUESTA.ancho;

const AZUL_TABLA = "#3B7DD8";
const BORDE_TABLA = "#9DB4D3";
const TINTA = "#111111";
const NEGRITA = "Helvetica-Bold";

const estilos = StyleSheet.create({
  pagina: {
    paddingTop: ALTO_ENCABEZADO + 24,
    paddingBottom: ALTO_PIE + 18,
    paddingHorizontal: 64,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.4,
    color: TINTA,
  },
  encabezado: {
    position: "absolute",
    top: 0,
    left: 0,
    width: ANCHO_PAGINA,
    height: ALTO_ENCABEZADO,
  },
  pie: { position: "absolute", bottom: 0, left: 0, width: ANCHO_PAGINA, height: ALTO_PIE },
  pieImagen: { position: "absolute", top: 0, left: 0, width: ANCHO_PAGINA, height: ALTO_PIE },
  pieTexto: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 8.5,
  },
  titulo: { fontFamily: NEGRITA, fontSize: 12, textAlign: "center", marginBottom: 22 },
  fecha: { marginBottom: 20 },
  negrita: { fontFamily: NEGRITA },
  saludo: { marginBottom: 14 },
  parrafo: { textAlign: "justify", marginBottom: 7 },
  seccion: { fontFamily: NEGRITA, fontSize: 11.5, marginTop: 10, marginBottom: 6 },
  subrayado: { textDecoration: "underline" },
  tabla: {
    marginTop: 4,
    marginBottom: 10,
    borderTopWidth: 0.6,
    borderLeftWidth: 0.6,
    borderColor: BORDE_TABLA,
  },
  fila: { flexDirection: "row" },
  celda: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    fontSize: 8.5,
    textAlign: "center",
    borderRightWidth: 0.6,
    borderBottomWidth: 0.6,
    borderColor: BORDE_TABLA,
    justifyContent: "center",
  },
  celdaEncabezado: {
    backgroundColor: AZUL_TABLA,
    color: "#FFFFFF",
    fontFamily: NEGRITA,
    fontSize: 8,
  },
  ruta: { fontSize: 9, marginBottom: 3 },
  firma: { marginTop: 44 },
  alerta: {
    borderWidth: 1,
    borderColor: "#B91C1C",
    backgroundColor: "#FEF2F2",
    padding: 8,
    marginBottom: 12,
    color: "#991B1B",
    fontSize: 9.5,
  },
});

const COLUMNAS: { titulo: string; ancho: string }[] = [
  { titulo: "CLASE", ancho: "12%" },
  { titulo: "ACREEDOR", ancho: "21%" },
  { titulo: "CONCEPTO", ancho: "22%" },
  { titulo: "VR. ADEUDADO", ancho: "16%" },
  { titulo: "TIPO DE GARANTÍA", ancho: "17%" },
  { titulo: "MORA", ancho: "12%" },
];

/** Devuelve el texto con las frases indicadas en negrita. */
function resaltar(texto: string, frases: readonly string[] = FRASES_EN_NEGRITA) {
  const patron = new RegExp(
    `(${frases.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  );
  return texto.split(patron).map((parte, indice) =>
    frases.includes(parte) ? (
      <Text key={indice} style={estilos.negrita}>
        {parte}
      </Text>
    ) : (
      parte
    ),
  );
}

function Parrafo({ children }: { children: React.ReactNode }) {
  return <Text style={estilos.parrafo}>{children}</Text>;
}

function Seccion({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <Text style={estilos.seccion} minPresenceAhead={40}>
      {numero}. <Text style={estilos.subrayado}>{titulo}</Text>
    </Text>
  );
}

function Celda({
  ancho,
  encabezado,
  children,
}: {
  ancho: string;
  encabezado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[estilos.celda, { width: ancho }, encabezado ? estilos.celdaEncabezado : {}]}>
      <Text>{children}</Text>
    </View>
  );
}

function TablaAcreencias({ contenido }: { contenido: ContenidoPropuesta }) {
  return (
    <View style={estilos.tabla}>
      <View style={estilos.fila}>
        {COLUMNAS.map((columna) => (
          <Celda key={columna.titulo} ancho={columna.ancho} encabezado>
            {columna.titulo}
          </Celda>
        ))}
      </View>
      {contenido.acreencias.map((a, indice) => (
        <View key={indice} style={estilos.fila} wrap={false}>
          <Celda ancho={COLUMNAS[0]!.ancho}>{a.clase}</Celda>
          <Celda ancho={COLUMNAS[1]!.ancho}>{a.acreedor}</Celda>
          <Celda ancho={COLUMNAS[2]!.ancho}>{a.concepto || "—"}</Celda>
          <Celda ancho={COLUMNAS[3]!.ancho}>{formatearPesos(a.valorAdeudado)}</Celda>
          <Celda ancho={COLUMNAS[4]!.ancho}>{a.tipoGarantia}</Celda>
          <Celda ancho={COLUMNAS[5]!.ancho}>{a.mora}</Celda>
        </View>
      ))}
    </View>
  );
}

export function DocumentoPropuesta({ contenido: c }: { contenido: ContenidoPropuesta }) {
  return (
    <Document
      title={`Propuesta legal - ${c.nombreCliente}`}
      author={siteConfig.name}
      subject={c.titulo}
      language="es"
    >
      <Page size="A4" style={estilos.pagina}>
        <Image fixed src={ENCABEZADO_PROPUESTA.uri} style={estilos.encabezado} />
        <View fixed style={estilos.pie}>
          <Image src={PIE_PROPUESTA.uri} style={estilos.pieImagen} />
          <Text style={[estilos.pieTexto, { top: ALTO_PIE * 0.14 }]}>
            Tel: {c.membrete.telefonos}
          </Text>
          <Text style={[estilos.pieTexto, { top: ALTO_PIE * 0.3 }]}>Email: {c.membrete.email}</Text>
          <Text style={[estilos.pieTexto, { top: ALTO_PIE * 0.66 }]}>{c.membrete.direccion}</Text>
        </View>

        {c.errores.length > 0 ? (
          <View style={estilos.alerta}>
            <Text style={estilos.negrita}>REQUIERE REVISIÓN ANTES DE GENERAR PROPUESTA</Text>
            {c.errores.map((error, indice) => (
              <Text key={indice}>• {error}</Text>
            ))}
          </View>
        ) : null}

        <Text style={estilos.titulo}>{c.titulo}</Text>
        <Text style={estilos.fecha}>{c.lugarYFecha}</Text>
        <Text style={estilos.negrita}>{c.tratamiento}</Text>
        <Text style={estilos.negrita}>{c.nombreCliente}</Text>
        <Text style={estilos.saludo}>{c.saludo}</Text>
        <Parrafo>{c.introduccion}</Parrafo>

        <Seccion numero={1} titulo={TITULOS_SECCIONES.situacionEconomica} />
        {c.situacionEconomica.map((parrafo, indice) => (
          <Parrafo key={indice}>{parrafo}</Parrafo>
        ))}
        <Parrafo>{c.pasivo}</Parrafo>
        <TablaAcreencias contenido={c} />
        {c.analisisAcreencias.map((parrafo, indice) => (
          <Parrafo key={indice}>{parrafo}</Parrafo>
        ))}

        <Seccion numero={2} titulo={TITULOS_SECCIONES.situacionLegal} />
        {c.situacionLegal.map((parrafo, indice) => (
          <Parrafo key={indice}>{parrafo}</Parrafo>
        ))}

        <Seccion numero={3} titulo={TITULOS_SECCIONES.recomendacion} />
        {c.recomendacion.map((parrafo, indice) => (
          <Parrafo key={indice}>{parrafo}</Parrafo>
        ))}
        <Parrafo>{resaltar(c.parrafoFijoRecomendacion)}</Parrafo>

        <Seccion numero={4} titulo={TITULOS_SECCIONES.honorarios} />
        {c.honorarios.map((parrafo, indice) => (
          <Parrafo key={indice}>{parrafo}</Parrafo>
        ))}

        <Seccion numero={5} titulo={TITULOS_SECCIONES.gestion} />
        {c.gestion.map((parrafo, indice) => (
          <Parrafo key={indice}>{parrafo}</Parrafo>
        ))}

        <Seccion numero={6} titulo={TITULOS_SECCIONES.idoneidad} />
        {c.idoneidad.parrafos.map((parrafo, indice) => (
          <Parrafo key={indice}>{resaltar(parrafo)}</Parrafo>
        ))}
        {c.idoneidad.rutaConsulta.map((linea, indice) => (
          <Text key={indice} style={estilos.ruta}>
            {linea}
          </Text>
        ))}
        {c.idoneidad.cierre.map((parrafo, indice) => (
          <Parrafo key={indice}>{resaltar(parrafo)}</Parrafo>
        ))}

        <Parrafo>{c.despedida}</Parrafo>
        <Text>{c.cordialmente}</Text>
        <View style={estilos.firma} wrap={false}>
          <Text style={estilos.negrita}>{c.firma.nombre}</Text>
          <Text>{c.firma.cargo}</Text>
          <Text style={estilos.negrita}>{c.firma.empresa}</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Genera el PDF y lo devuelve como bytes listos para la respuesta HTTP. */
export async function renderizarPropuestaPdf(
  contenido: ContenidoPropuesta,
): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await renderToBuffer(<DocumentoPropuesta contenido={contenido} />);
  return new Uint8Array(buffer);
}
