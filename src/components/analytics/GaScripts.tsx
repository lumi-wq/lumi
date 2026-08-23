import Script from "next/script";
import {
  AW_CONVERSION_ID,
  GA_CONSENT_KEY,
  GA_MEASUREMENT_ID,
  isGaEnabled,
} from "@/lib/ga";
import { GaClient } from "./GaClient";

export function GaScripts() {
  if (!isGaEnabled()) return null;

  const debugMode = process.env.NODE_ENV === "development";

  return (
    <>
      <Script
        id="ga-consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
try {
  if (localStorage.getItem(${JSON.stringify(GA_CONSENT_KEY)}) === 'granted') {
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted'
    });
  }
} catch (e) {}
          `.trim(),
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID || AW_CONVERSION_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
${
  GA_MEASUREMENT_ID
    ? `gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)}, {
  anonymize_ip: true,
  send_page_view: false${debugMode ? ",\n  debug_mode: true" : ""}
});`
    : ""
}
${AW_CONVERSION_ID ? `gtag('config', ${JSON.stringify(AW_CONVERSION_ID)});` : ""}
          `.trim(),
        }}
      />
      <GaClient />
    </>
  );
}
