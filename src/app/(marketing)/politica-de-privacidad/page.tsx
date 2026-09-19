import type { Metadata } from "next";

import { DatosResponsable, PaginaLegal } from "@/components/marketing/pagina-legal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos personales",
  description: `Cómo ${siteConfig.name} recolecta, usa y protege tus datos personales (Ley 1581 de 2012).`,
  alternates: { canonical: "/politica-de-privacidad" },
};

export default function PoliticaPrivacidadPage() {
  const { contact } = siteConfig;

  return (
    <PaginaLegal titulo="Política de tratamiento de datos personales">
      <p>
        Esta política explica cómo {siteConfig.name} trata los datos personales de quienes visitan
        este sitio, agendan una consulta o usan el portal de clientes, en cumplimiento de la Ley
        Estatutaria 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y
        demás normas que las modifiquen o complementen.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <DatosResponsable />

      <h2>2. Datos que tratamos</h2>
      <ul>
        <li>
          <strong>Identificación y contacto:</strong> nombre, tipo y número de documento, correo,
          teléfono y ciudad.
        </li>
        <li>
          <strong>Información financiera y jurídica:</strong> deudas, acreedores, ingresos, gastos,
          bienes, procesos judiciales o de cobro y demás información necesaria para evaluar y
          adelantar tu proceso de insolvencia.
        </li>
        <li>
          <strong>Datos de la cuenta:</strong> correo y nombre asociados a tu cuenta de Google u
          otro método de acceso, y registros de uso del portal.
        </li>
        <li>
          <strong>Datos de navegación:</strong> información técnica y de interacción recogida con
          cookies y herramientas de medición.
        </li>
      </ul>
      <p>
        No solicitamos datos sensibles salvo que sean estrictamente necesarios para tu caso. Cuando
        lo hagamos, te informaremos que no estás obligado a suministrarlos.
      </p>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Atender tus solicitudes y agendar la consulta gratuita.</li>
        <li>
          Analizar tu situación financiera, determinar la viabilidad del proceso de insolvencia y
          elaborar la propuesta correspondiente.
        </li>
        <li>Prestar los servicios contratados y representarte ante acreedores y autoridades.</li>
        <li>Darte acceso al portal para consultar el estado de tu proceso y tus documentos.</li>
        <li>Enviarte comunicaciones relacionadas con tu caso.</li>
        <li>Medir y mejorar nuestro sitio y nuestras campañas de comunicación.</li>
        <li>Cumplir obligaciones legales, contables y requerimientos de autoridades.</li>
      </ul>

      <h2>4. Proveedores y transferencias internacionales</h2>
      <p>
        Para operar usamos proveedores tecnológicos que actúan como encargados del tratamiento y
        pueden almacenar la información fuera de Colombia: alojamiento web, base de datos y
        autenticación, agenda de citas, inicio de sesión con Google, herramientas de medición y,
        cuando se utilicen, herramientas de inteligencia artificial que asisten al equipo en la
        redacción de documentos. Con estas últimas compartimos solo la información mínima necesaria
        y nunca sin revisión profesional del resultado.
      </p>
      <p>
        Al aceptar esta política autorizas la transmisión y transferencia internacional de tus datos
        a dichos proveedores, que deben ofrecer niveles adecuados de protección y usar la
        información únicamente para prestarnos sus servicios.
      </p>

      <h2>5. Tus derechos</h2>
      <p>Como titular de los datos tienes derecho a:</p>
      <ul>
        <li>Conocer, actualizar y rectificar tus datos personales.</li>
        <li>Solicitar prueba de la autorización que nos otorgaste.</li>
        <li>Ser informado sobre el uso que hemos dado a tus datos.</li>
        <li>
          Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la
          ley.
        </li>
        <li>
          Revocar la autorización o solicitar la supresión de tus datos cuando no exista un deber
          legal o contractual de conservarlos.
        </li>
        <li>Acceder de forma gratuita a tus datos personales.</li>
      </ul>

      <h2>6. Cómo ejercer tus derechos</h2>
      <p>
        Escríbenos a <a href={`mailto:${contact.email}`}>{contact.email}</a> indicando tu nombre,
        documento de identidad, la solicitud concreta y un medio de respuesta.
      </p>
      <ul>
        <li>
          <strong>Consultas:</strong> se responden en un máximo de diez (10) días hábiles,
          prorrogables por cinco (5) días hábiles más, informándote el motivo.
        </li>
        <li>
          <strong>Reclamos:</strong> se atienden en un máximo de quince (15) días hábiles,
          prorrogables por ocho (8) días hábiles más. Si el reclamo está incompleto, te pediremos
          completarlo dentro de los cinco (5) días siguientes a su recepción.
        </li>
      </ul>

      <h2>7. Seguridad y conservación</h2>
      <p>
        Aplicamos medidas técnicas, humanas y administrativas para proteger tu información: acceso
        restringido por roles, cifrado en tránsito, almacenamiento privado de documentos y registro
        de cambios. Conservamos los datos mientras sean necesarios para las finalidades descritas y
        durante los plazos que exija la ley.
      </p>

      <h2>8. Cookies y medición</h2>
      <p>
        Este sitio puede usar cookies propias y de terceros (por ejemplo, Google Analytics o Meta)
        para medir visitas y la efectividad de nuestras campañas. Puedes bloquearlas o eliminarlas
        desde la configuración de tu navegador. El portal de clientes no carga herramientas de
        medición publicitaria.
      </p>

      <h2>9. Menores de edad</h2>
      <p>Nuestros servicios están dirigidos a personas mayores de edad.</p>

      <h2>10. Vigencia y cambios</h2>
      <p>
        Esta política rige desde el {siteConfig.legal.politicaDatosFecha}. Si la modificamos de
        forma sustancial, te lo informaremos y, cuando sea necesario, te pediremos una nueva
        autorización.
      </p>
    </PaginaLegal>
  );
}
