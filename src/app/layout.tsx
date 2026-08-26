import type { Metadata } from "next";
import { Gabarito, Inter, Manrope } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GaScripts } from "@/components/analytics/GaScripts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, getSiteUrl } from "@/lib/site";
import {
  BRAND,
  BRAND_COUNTRY,
  BRAND_EMAIL,
  BRAND_LEGAL,
  BRAND_LOCALITY,
  BRAND_PHONE,
  BRAND_REGION,
  BRAND_STREET,
  BRAND_TELEGRAM_URL,
} from "@/lib/seo";
import "./globals.css";

// Gabarito та Geist не підтримують кирилицю, тому підключаємо
// візуально близькі Manrope/Inter як фолбек для українських текстів.
const gabarito = Gabarito({ subsets: ["latin"], variable: "--font-gabarito-latin" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

const isVercelPreview = process.env.VERCEL_ENV === "preview";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "LUMI — одяг для дітей 6–16 років купити в Україні",
    template: "%s | LUMI",
  },
  description:
    "Інтернет-магазин дитячого та підліткового одягу 6–16 років. Доставка Новою Поштою по Україні, оплата карткою онлайн.",
  openGraph: {
    siteName: BRAND,
    locale: "uk_UA",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  robots: isVercelPreview
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
      },
  verification: {
    google: "gc_8eG8BlCf8mQLhOdiTLspp0wvkhwL1tTt-dQSi0Ag",
  },
  other: {
    "geo.region": "UA",
    "geo.placename": `${BRAND_LOCALITY}, ${BRAND_REGION}`,
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "OnlineStore"],
  name: BRAND,
  legalName: BRAND_LEGAL,
  url: getSiteUrl(),
  logo: absoluteUrl("/icon-192.png"),
  email: BRAND_EMAIL,
  telephone: BRAND_PHONE,
  inLanguage: "uk-UA",
  sameAs: [BRAND_TELEGRAM_URL],
  areaServed: {
    "@type": "Country",
    name: "Ukraine",
    sameAs: "https://www.wikidata.org/wiki/Q212",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: BRAND_STREET,
    addressLocality: BRAND_LOCALITY,
    addressRegion: BRAND_REGION,
    addressCountry: BRAND_COUNTRY,
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: BRAND_PHONE,
    email: BRAND_EMAIL,
    contactType: "customer service",
    areaServed: "UA",
    availableLanguage: ["uk"],
    url: BRAND_TELEGRAM_URL,
  },
  availableLanguage: ["uk"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND,
  url: getSiteUrl(),
  inLanguage: "uk-UA",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk-UA" className={`${gabarito.variable} ${manrope.variable} ${GeistSans.variable} ${inter.variable}`}>
      <body>
        <JsonLd data={orgJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <Providers>
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </Providers>
        <GaScripts />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
