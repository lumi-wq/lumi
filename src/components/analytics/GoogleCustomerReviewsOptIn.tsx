"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { GCR_MERCHANT_ID } from "@/lib/google-customer-reviews";

type Props = {
  orderId: string;
  email: string;
  estimatedDeliveryDate: string;
};

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: {
      load: (name: string, cb: () => void) => void;
      surveyoptin?: {
        render: (opts: {
          merchant_id: number;
          order_id: string;
          email: string;
          delivery_country: string;
          estimated_delivery_date: string;
          opt_in_style?: string;
        }) => void;
      };
    };
  }
}

export function GoogleCustomerReviewsOptIn({ orderId, email, estimatedDeliveryDate }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const key = `gcr_optin_${orderId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode — все одно показуємо */
    }
    setReady(true);
  }, [orderId]);

  if (!ready || !email || !orderId || !estimatedDeliveryDate) return null;

  const payload = {
    merchant_id: GCR_MERCHANT_ID,
    order_id: orderId,
    email,
    delivery_country: "UA",
    estimated_delivery_date: estimatedDeliveryDate,
    opt_in_style: "CENTER_DIALOG",
  };

  return (
    <>
      <Script
        id="gcr-optin"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.renderOptIn = function() {
  window.gapi.load('surveyoptin', function() {
    window.gapi.surveyoptin.render(${JSON.stringify(payload)});
  });
};
          `.trim(),
        }}
      />
      <Script
        src="https://apis.google.com/js/platform.js?onload=renderOptIn"
        strategy="afterInteractive"
      />
    </>
  );
}
