import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";

import { env } from "@/lib/env";

/**
 * Medición de la web pública. Solo se carga en páginas de marketing, nunca en el panel ni en el
 * portal, para no enviar datos de clientes a terceros.
 */
export function Analytics() {
  const gaId = env.NEXT_PUBLIC_GA_ID;
  const pixelId = env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      {pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(pixelId)});fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
