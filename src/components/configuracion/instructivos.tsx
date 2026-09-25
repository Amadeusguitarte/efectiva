import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function Pasos({ pasos }: { pasos: React.ReactNode[] }) {
  return (
    <ol className="grid gap-2 text-sm text-foreground">
      {pasos.map((paso, indice) => (
        <li key={indice} className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {indice + 1}
          </span>
          <span className="pt-0.5">{paso}</span>
        </li>
      ))}
    </ol>
  );
}

export function InstructivoWhatsApp() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cómo conectar WhatsApp</CardTitle>
        <CardDescription>
          Se vincula como un dispositivo más (igual que WhatsApp Web), escaneando un código QR con
          el teléfono del número que atenderá el CRM.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Pasos
          pasos={[
            <>
              Confirma que el proceso <strong>worker</strong> esté corriendo (arriba dice «Worker
              activo»). En Railway es el servicio <code>worker</code> del proyecto; en local,{" "}
              <code>npm run worker</code>.
            </>,
            <>Pulsa «Generar QR de nuevo». En unos segundos aparece el código.</>,
            <>
              En el teléfono abre WhatsApp → Menú (⋮) o Configuración →{" "}
              <strong>Dispositivos vinculados</strong> → <strong>Vincular un dispositivo</strong> y
              escanea el código.
            </>,
            <>
              El estado pasa a «Conectado» y muestra el número. La sesión queda guardada: no hay que
              volver a escanear.
            </>,
            <>
              Desde ese momento cada mensaje que llegue crea o actualiza un caso en el pipeline y
              avisa al responsable. Se responde desde la bandeja de WhatsApp o la ficha del caso,
              siempre a mano.
            </>,
            <>Para usar otro número, pulsa «Cerrar sesión» y repite el proceso.</>,
          ]}
        />
        <div className="rounded-lg bg-surface-soft p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Recomendaciones</p>
          <ul className="mt-1 list-disc pl-5">
            <li>Usa un número dedicado a la firma, no el personal de un integrante.</li>
            <li>
              El teléfono debe seguir encendido y con internet; si pierde la sesión, aquí aparecerá
              un QR nuevo.
            </li>
            <li>No abras la misma sesión en otra herramienta de automatización a la vez.</li>
            <li>No hay respuestas automáticas: nadie recibe mensajes escritos por un bot.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

const SERVIDORES = [
  {
    proveedor: "Gmail / Google Workspace",
    smtp: "smtp.gmail.com",
    smtpPuerto: "465 (SSL)",
    imap: "imap.gmail.com",
    imapPuerto: "993 (SSL)",
  },
  {
    proveedor: "Outlook / Microsoft 365",
    smtp: "smtp.office365.com",
    smtpPuerto: "587 (STARTTLS, «seguro» apagado)",
    imap: "outlook.office365.com",
    imapPuerto: "993 (SSL)",
  },
  {
    proveedor: "Hostinger",
    smtp: "smtp.hostinger.com",
    smtpPuerto: "465 (SSL)",
    imap: "imap.hostinger.com",
    imapPuerto: "993 (SSL)",
  },
  {
    proveedor: "Zoho Mail",
    smtp: "smtp.zoho.com",
    smtpPuerto: "465 (SSL)",
    imap: "imap.zoho.com",
    imapPuerto: "993 (SSL)",
  },
];

export function InstructivoCorreo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cómo conectar el correo</CardTitle>
        <CardDescription>
          El CRM recibe por IMAP los correos que lleguen a la cuenta y envía por SMTP las respuestas
          y los correos automáticos de las etapas.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Pasos
          pasos={[
            <>
              Usa una cuenta dedicada al CRM (por ejemplo <em>contacto@insolvenciaefectiva.com</em>
              ), para no mezclar correos personales.
            </>,
            <>
              <strong>Gmail:</strong> activa la verificación en dos pasos y crea una «contraseña de
              aplicación» en <em>myaccount.google.com/apppasswords</em>. La contraseña normal no
              funciona por SMTP/IMAP. <strong>Outlook:</strong> también requiere contraseña de
              aplicación si la cuenta tiene verificación en dos pasos.
            </>,
            <>
              Escribe el usuario (normalmente el correo completo), la contraseña de aplicación y los
              servidores de la tabla.
            </>,
            <>Guarda y pulsa «Probar conexión»: debe confirmar SMTP e IMAP.</>,
            <>
              Marca «Activar» para que el worker revise la bandeja cada minuto. Cada correo nuevo
              crea o actualiza un caso y avisa al responsable; se responde desde la bandeja de
              Correo o la ficha del caso.
            </>,
          ]}
        />
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Proveedor</th>
                <th className="px-3 py-2 font-medium">SMTP (envío)</th>
                <th className="px-3 py-2 font-medium">IMAP (recepción)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {SERVIDORES.map((s) => (
                <tr key={s.proveedor}>
                  <td className="px-3 py-2 font-medium">{s.proveedor}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {s.smtp} · {s.smtpPuerto}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {s.imap} · {s.imapPuerto}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Para volumen alto de envíos conviene un dominio propio con SPF y DKIM configurados; enviar
          masivos desde Gmail perjudica la entregabilidad.
        </p>
      </CardContent>
    </Card>
  );
}
