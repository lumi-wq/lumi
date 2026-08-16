/** Канонічний прод-домен. Canonical / sitemap / schema мають вказувати сюди. */
export const PRODUCTION_ORIGIN = "https://lumi.kids";

const PREVIEW_HOST =
  /localhost|127\.0\.0\.1|trycloudflare\.com|ngrok|vercel\.app|cloudflarepreview/i;

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const isPreviewHost = !fromEnv || PREVIEW_HOST.test(fromEnv);

  // На Vercel Production не віддаємо canonical/sitemap на тунель чи *.vercel.app
  if (process.env.VERCEL_ENV === "production" && isPreviewHost) {
    return PRODUCTION_ORIGIN;
  }
  if (fromEnv) return fromEnv;
  return "http://localhost:3000";
}

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
