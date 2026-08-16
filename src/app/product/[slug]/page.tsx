import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toCardData } from "@/lib/types";
import { isFeaturedActive } from "@/lib/featured";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { canonicalMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { typeClusterPath } from "@/lib/seo-landing-paths";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { productType: true },
  });
  if (!product) return {};
  const who = product.gender === "GIRL" ? "дівчаток" : "хлопчиків";
  const typeName = product.productType?.name;
  const description = `${product.description} Купити онлайн з доставкою Новою Поштою по Україні.`.slice(
    0,
    320
  );
  const path = `/product/${product.slug}`;
  return {
    title: `${product.name} для ${who}`,
    description,
    ...canonicalMetadata(path),
    openGraph: {
      ...canonicalMetadata(path).openGraph,
      title: `${product.name}${typeName ? ` — ${typeName}` : ""} | LUMI`,
      description,
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      variants: true,
      colors: { orderBy: { sortOrder: "asc" } },
      category: true,
      productType: true,
    },
  });
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      ...(product.productTypeId
        ? { productTypeId: product.productTypeId }
        : { categoryId: product.categoryId }),
    },
    include: { variants: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 4,
  });

  const colors =
    product.colors.length > 0
      ? product.colors.map((c) => ({
          id: c.id,
          name: c.name,
          colorHex: c.colorHex,
          images: c.images.length ? c.images : product.images,
        }))
      : Array.from(
          new Map(product.variants.map((v) => [v.colorHex.toUpperCase(), v])).values()
        ).map((v, i) => ({
          id: `legacy-${i}`,
          name: v.color,
          colorHex: v.colorHex,
          images: product.images,
        }));

  const inStock = product.variants.some((v) => v.stock > 0);
  const url = absoluteUrl(`/product/${product.slug}`);
  const genderParent = product.gender === "GIRL" ? "girls" : "boys";
  const genderHref = `/category/${genderParent}`;
  const genderLabel = product.gender === "GIRL" ? "Дівчатка" : "Хлопчики";
  const typeHref = product.productType
    ? typeClusterPath(genderParent, product.productType.slug)
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.slug,
    brand: { "@type": "Brand", name: "LUMI" },
    category: product.productType?.name,
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "UAH",
      price: product.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url,
      seller: { "@type": "Organization", name: "LUMI" },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: genderLabel, item: absoluteUrl(genderHref) },
      ...(typeHref && product.productType
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.productType.name,
              item: absoluteUrl(typeHref),
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: typeHref ? 4 : 3,
        name: product.name,
        item: url,
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbLd} />
      <section className="bg-chalk">
        <div className="container-content py-8">
          <nav className="text-[13px] text-obsidian/60" aria-label="Хлібні крихти">
            <Link href="/" className="hover:text-cobalt">
              Головна
            </Link>
            <span className="mx-2">›</span>
            <Link href={genderHref} className="hover:text-cobalt">
              {genderLabel}
            </Link>
            {typeHref && product.productType && (
              <>
                <span className="mx-2">›</span>
                <Link href={typeHref} className="hover:text-cobalt">
                  {product.productType.name}
                </Link>
              </>
            )}
            <span className="mx-2">›</span>
            <span className="font-medium text-obsidian">{product.name}</span>
          </nav>

          <ProductDetailClient
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              isSale: product.isSale,
              isFeatured: isFeaturedActive(product),
              tag: product.tag,
              tagStyle: product.tagStyle,
              materials: product.materials,
              description: product.description,
              fallbackImage: product.images[0] ?? "",
            }}
            colors={colors}
            variants={product.variants}
          />
        </div>
      </section>

      <section className="py-16">
        <div className="container-content">
          <p className="text-sm font-semibold uppercase tracking-widest text-cobalt">
            Доповніть образ
          </p>
          <h2 className="mt-2 font-display text-2xl font-black md:text-3xl">
            Вам також сподобається
          </h2>
          <div className="mt-8">
            <ProductGrid products={related.map(toCardData)} columns={4} />
          </div>
        </div>
      </section>
    </>
  );
}
