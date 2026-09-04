import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const BRAND = "LUMI";
export const BRAND_LEGAL = "ФОП Георгіян Наталія Миколаївна";
export const BRAND_EMAIL = "lumi@lumi.kids";
export const BRAND_PHONE = "+380983018093";
export const BRAND_PHONE_DISPLAY = "+38 (098) 301-80-93";
export const BRAND_TELEGRAM_URL = "https://t.me/+380983018093";
export const BRAND_STREET = "вул. Шевченка, 11 Б";
export const BRAND_LOCALITY = "Сокиряни";
export const BRAND_DISTRICT = "Дністровський район";
export const BRAND_REGION = "Чернівецька область";
export const BRAND_POSTAL_CODE = "60200";
export const BRAND_COUNTRY = "UA";
/** Повна адреса магазину і Merchant Center — без ФОП / ІПН. */
export const BRAND_ADDRESS = `${BRAND_REGION}, ${BRAND_DISTRICT}, м. ${BRAND_LOCALITY}, ${BRAND_STREET}`;
export const BRAND_MAPS_URL = `https://maps.google.com/?q=${encodeURIComponent(BRAND_ADDRESS)}`;

export const NOINDEX: Pick<Metadata, "robots"> = {
  robots: { index: false, follow: false },
};

export const NOINDEX_FOLLOW: Pick<Metadata, "robots"> = {
  robots: { index: false, follow: true },
};

export function canonicalMetadata(path: string): Pick<Metadata, "alternates" | "openGraph"> {
  const url = absoluteUrl(path);
  return {
    alternates: {
      canonical: url,
      languages: {
        "uk-UA": url,
        "x-default": url,
      },
    },
    openGraph: { url, locale: "uk_UA" },
  };
}

export function listingTitle(name: string): string {
  return `${name} купити в Україні`;
}
