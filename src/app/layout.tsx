import type { Metadata } from "next";
import { Gabarito, Inter, Manrope } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";
import "./globals.css";

// Gabarito та Geist не підтримують кирилицю, тому підключаємо
// візуально близькі Manrope/Inter як фолбек для українських текстів.
const gabarito = Gabarito({ subsets: ["latin"], variable: "--font-gabarito-latin" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "LUMI — стильний одяг для дітей та підлітків",
    template: "%s | LUMI",
  },
  description:
    "Модний дитячий та підлітковий одяг з натуральних матеріалів. Зручно, стильно, якісно. Безкоштовна доставка від 1 500 ₴.",
  openGraph: {
    siteName: "LUMI",
    locale: "uk_UA",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${gabarito.variable} ${manrope.variable} ${GeistSans.variable} ${inter.variable}`}>
      <body>
        <Providers>
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
