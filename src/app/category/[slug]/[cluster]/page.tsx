import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/CatalogView";
import {
  BASE_COLLECTIONS,
  collectionFromLanding,
  loadCatalogListing,
  shouldNoindexCatalog,
  type CatalogSearchParams,
} from "@/lib/catalog";
import { getClusterLanding, listClusterParams } from "@/lib/seo-landings";
import { canonicalMetadata, NOINDEX_FOLLOW } from "@/lib/seo";

export const revalidate = 60;

export function generateStaticParams() {
  return listClusterParams();
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string; cluster: string };
  searchParams: CatalogSearchParams;
}): Promise<Metadata> {
  const landing = getClusterLanding(params.slug, params.cluster);
  if (!landing) return {};
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const canonicalPath = page > 1 ? `${landing.path}?page=${page}` : landing.path;
  const collection = collectionFromLanding(landing);
  const listing = await loadCatalogListing(collection, searchParams);
  return {
    title: landing.title,
    description: landing.description,
    ...canonicalMetadata(canonicalPath),
    ...(shouldNoindexCatalog(collection, listing.total, searchParams) ? NOINDEX_FOLLOW : {}),
    openGraph: {
      ...canonicalMetadata(canonicalPath).openGraph,
      title: `${landing.h1} | LUMI`,
      description: landing.description,
    },
  };
}

export default async function ClusterCategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string; cluster: string };
  searchParams: CatalogSearchParams;
}) {
  const landing = getClusterLanding(params.slug, params.cluster);
  if (!landing) notFound();

  const collection = collectionFromLanding(landing);
  const listing = await loadCatalogListing(collection, searchParams);
  const parent = BASE_COLLECTIONS[params.slug];
  const typeNavParent =
    landing.productTypeSlug &&
    (landing.parent === "girls" || landing.parent === "boys" || landing.parent === "accessories")
      ? landing.parent
      : undefined;

  return (
    <CatalogView
      collection={collection}
      listing={listing}
      crumbs={[
        { name: parent?.name ?? "Каталог", href: parent?.path ?? `/category/${params.slug}` },
        { name: landing.name, href: landing.path },
      ]}
      typeNavParent={typeNavParent}
    />
  );
}
