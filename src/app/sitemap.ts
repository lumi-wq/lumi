import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ select: { slug: true, createdAt: true } }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({
      url: `${base}/category/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
