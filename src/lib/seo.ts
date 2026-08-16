import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const BRAND = "LUMI";
export const BRAND_LEGAL = "ФОП Георгіян Наталія Миколаївна";
export const BRAND_EMAIL = "lumi@lumi.kids";

export const NOINDEX: Pick<Metadata, "robots"> = {
  robots: { index: false, follow: false },
};

export const NOINDEX_FOLLOW: Pick<Metadata, "robots"> = {
  robots: { index: false, follow: true },
};

export function canonicalMetadata(path: string): Pick<Metadata, "alternates" | "openGraph"> {
  const url = absoluteUrl(path);
  return {
    alternates: { canonical: url },
    openGraph: { url },
  };
}

export function listingTitle(name: string): string {
  return `${name} купити в Україні`;
}
