import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SEO_LANDINGS } from "@/lib/seo-landings";
import { getSiteUrl } from "@/lib/site";

const VIRTUAL_CATEGORY_SLUGS = ["sale", "new", "girls", "boys", "accessories"] as const;

function staticEntries(base: string): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/size-guide`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    ...VIRTUAL_CATEGORY_SLUGS.map((slug) => ({
      url: `${base}/category/${slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...SEO_LANDINGS.map((l) => ({
      url: `${base}${l.path}`,
      changeFrequency: "weekly" as const,
      priority: l.parent === "root" ? 0.85 : 0.8,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const staticUrls = staticEntries(base);

  try {
    const [products, dbCategories] = await Promise.all([
      prisma.product.findMany({ select: { slug: true, createdAt: true } }),
      prisma.category.findMany({ select: { slug: true } }),
    ]);

    return [
      ...staticUrls,
      ...dbCategories
        .filter((c) => !(VIRTUAL_CATEGORY_SLUGS as readonly string[]).includes(c.slug))
        .map((c) => ({
          url: `${base}/category/${c.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.5,
        })),
      ...products.map((p) => ({
        url: `${base}/product/${p.slug}`,
        lastModified: p.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch (err) {
    console.error("[sitemap] database unavailable, returning static URLs", err);
    return staticUrls;
  }
}
