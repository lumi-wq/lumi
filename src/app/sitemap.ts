import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import {
  BASE_COLLECTIONS,
  collectionFromLanding,
  productFitsCollection,
  type CatalogCollection,
  type CatalogFitProduct,
} from "@/lib/catalog";
import { SEO_LANDINGS } from "@/lib/seo-landings";
import { TEST_PAYMENT_SLUG } from "@/lib/test-payment";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

function staticEntries(base: string): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/size-guide`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}

function collectionMeta(collection: CatalogCollection): Pick<
  MetadataRoute.Sitemap[number],
  "changeFrequency" | "priority"
> {
  if (BASE_COLLECTIONS[collection.slug]?.path === collection.path) {
    return { changeFrequency: "daily", priority: 0.9 };
  }
  const landing = SEO_LANDINGS.find((l) => l.path === collection.path);
  return {
    changeFrequency: "weekly",
    priority: landing?.parent === "root" ? 0.85 : 0.8,
  };
}

function newestDate(dates: Date[]): Date | undefined {
  if (dates.length === 0) return undefined;
  return dates.reduce((latest, d) => (d > latest ? d : latest));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const staticUrls = staticEntries(base);

  try {
    const products = await prisma.product.findMany({
      where: { slug: { not: TEST_PAYMENT_SLUG } },
      select: {
        slug: true,
        createdAt: true,
        gender: true,
        isSale: true,
        isFeatured: true,
        featuredAt: true,
        categoryId: true,
        productType: { select: { slug: true, unisex: true } },
        variants: { select: { size: true } },
      },
    });

    const fitProducts: (CatalogFitProduct & { slug: string; createdAt: Date })[] = products.map(
      (p) => ({
        slug: p.slug,
        createdAt: p.createdAt,
        gender: p.gender,
        isSale: p.isSale,
        isFeatured: p.isFeatured,
        featuredAt: p.featuredAt,
        categoryId: p.categoryId,
        productTypeSlug: p.productType?.slug ?? null,
        productTypeUnisex: Boolean(p.productType?.unisex),
        sizes: p.variants.map((v) => v.size),
      })
    );

    const collections: CatalogCollection[] = [
      ...Object.values(BASE_COLLECTIONS),
      ...SEO_LANDINGS.map(collectionFromLanding),
    ];

    const collectionUrls = collections.flatMap((collection) => {
      const matching = fitProducts.filter((p) => productFitsCollection(p, collection));
      if (matching.length === 0) return [];
      return [
        {
          url: `${base}${collection.path}`,
          lastModified: newestDate(matching.map((p) => p.createdAt)),
          ...collectionMeta(collection),
        },
      ];
    });

    return [
      ...staticUrls,
      ...collectionUrls,
      ...fitProducts.map((p) => ({
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
