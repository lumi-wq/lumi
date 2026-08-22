import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/media/"],
        disallow: ["/admin", "/api", "/profile", "/checkout", "/cart", "/wishlist", "/auth"],
      },
      // Google Shopping качає фото з /api/media; без цього Merchant Center показує
      // «Не вдалося показати зображення».
      {
        userAgent: ["Googlebot", "Googlebot-Image", "AdsBot-Google"],
        allow: ["/api/media/"],
        disallow: ["/admin", "/api", "/profile", "/checkout", "/cart", "/wishlist", "/auth"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ""),
  };
}
