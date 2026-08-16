import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CatalogView } from "@/components/catalog/CatalogView";
import {
  BASE_COLLECTIONS,
  collectionFromLanding,
  hasIndexableFilters,
  loadCatalogListing,
  type CatalogCollection,
  type CatalogSearchParams,
} from "@/lib/catalog";
import { getRootLanding, listRootLandingSlugs } from "@/lib/seo-landings";
import { canonicalMetadata, listingTitle, NOINDEX_FOLLOW } from "@/lib/seo";

export const revalidate = 60;

async function getCollection(slug: string): Promise<CatalogCollection | null> {
  if (slug in BASE_COLLECTIONS) return BASE_COLLECTIONS[slug];
  const landing = getRootLanding(slug);
  if (landing) return collectionFromLanding(landing);
  const row = await prisma.category.findUnique({ where: { slug } });
  if (!row) return null;
  return {
    slug: row.slug,
    path: `/category/${row.slug}`,
    name: row.name,
    h1: row.name,
    description: row.description,
    categoryId: row.id,
  };
}

export async function generateStaticParams() {
  const fromDb = await prisma.category.findMany({ select: { slug: true } });
  return [
    ...Object.keys(BASE_COLLECTIONS).map((slug) => ({ slug })),
    ...listRootLandingSlugs().map((slug) => ({ slug })),
    ...fromDb.map((c) => ({ slug: c.slug })),
  ];
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: CatalogSearchParams;
}): Promise<Metadata> {
  const collection = await getCollection(params.slug);
  if (!collection) return {};
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const canonicalPath = page > 1 ? `${collection.path}?page=${page}` : collection.path;
  const filtered = hasIndexableFilters(collection, searchParams);
  return {
    title: listingTitle(collection.h1),
    description: collection.description,
    ...canonicalMetadata(canonicalPath),
    ...(filtered ? NOINDEX_FOLLOW : {}),
    openGraph: {
      ...canonicalMetadata(canonicalPath).openGraph,
      title: `${collection.h1} | LUMI`,
      description: collection.description,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: CatalogSearchParams;
}) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();

  const listing = await loadCatalogListing(collection, searchParams);
  const typeNavParent =
    collection.slug === "girls" || collection.slug === "boys" || collection.slug === "accessories"
      ? collection.slug
      : undefined;

  const crumbs = [{ name: collection.name, href: collection.path }];

  return (
    <CatalogView
      collection={collection}
      listing={listing}
      crumbs={crumbs}
      typeNavParent={typeNavParent}
    />
  );
}
