import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const VIRTUAL_CATEGORY_SLUGS = ["sale", "new", "girls", "boys"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const products = await prisma.product.findMany({ select: { slug: true, createdAt: true } });
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...VIRTUAL_CATEGORY_SLUGS.map((slug) => ({
      url: `${base}/category/${slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
