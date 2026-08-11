import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toCardData } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Gallery } from "@/components/product/Gallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Tag } from "@/components/product/Tag";
import { ProductPrice } from "@/components/product/ProductPrice";
import { StarIcon } from "@/components/Icons";

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
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} | LUMI`,
      description: product.description,
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      variants: true,
      category: true,
      reviews: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    include: { variants: true },
    orderBy: { rating: "desc" },
    take: 4,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.slug,
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "UAH",
      price: product.price,
      availability: "https://schema.org/InStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/product/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="bg-chalk">
        <div className="container-content py-8">
          <nav className="text-[13px] text-obsidian/60" aria-label="Хлібні крихти">
            <Link href="/" className="hover:text-cobalt">Головна</Link>
            <span className="mx-2">›</span>
            <Link href={`/category/${product.category.slug}`} className="hover:text-cobalt">
              {product.category.name}
            </Link>
            <span className="mx-2">›</span>
            <span className="font-medium text-obsidian">{product.name}</span>
          </nav>

          <div className="mt-8 grid gap-12 lg:grid-cols-2">
            <Gallery images={product.images} alt={product.name} />

            <div>
              <div className="flex items-center gap-3">
                {product.isSale ? (
                  <Tag label="Розпродаж" style="dark" />
                ) : (
                  product.tag && <Tag label={product.tag} style={product.tagStyle} />
                )}
                <span className="flex items-center gap-1.5 text-sm text-obsidian/70">
                  <StarIcon className="h-4 w-4 text-cobalt" />
                  {product.rating} ({product.reviewCount} відгуків)
                </span>
              </div>
              <h1 className="mt-4 font-display text-3xl font-black md:text-[40px]">{product.name}</h1>
              <ProductPrice
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                size="lg"
                className="mt-3"
              />

              <ProductPurchase
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  image: product.images[0] ?? "",
                }}
                variants={product.variants}
              />

              <div className="mt-10 border-t border-black/10 pt-6">
                <h3 className="text-base font-bold">Про матеріали</h3>
                <p className="mt-2 text-sm leading-relaxed text-obsidian/70">{product.materials}</p>
              </div>

              <div className="mt-6 border-t border-black/10 pt-6">
                <h3 className="text-base font-bold">Опис</h3>
                <p className="mt-2 text-sm leading-relaxed text-obsidian/70">{product.description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {product.reviews.length > 0 && (
        <section className="bg-white py-16">
          <div className="container-content">
            <h2 className="font-display text-2xl font-black md:text-3xl">Відгуки покупців</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {product.reviews.map((review) => (
                <div key={review.id} className="rounded-card bg-chalk p-6">
                  <div className="flex items-center gap-1 text-cobalt">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <StarIcon key={i} className="h-3.5 w-3.5" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{review.text}</p>
                  <p className="mt-4 text-xs font-semibold text-obsidian/60">
                    {review.authorName} • {formatDate(review.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
