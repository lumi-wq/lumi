import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toCardData } from "@/lib/types";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ArrowRightIcon } from "@/components/Icons";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { canonicalMetadata } from "@/lib/seo";
import { activeFeaturedWhere, expireFeaturedProducts } from "@/lib/featured";
import { PRODUCT_TYPE_TO_CLUSTER, typeClusterPath } from "@/lib/seo-landing-paths";
import { isAccessoryTypeSlug } from "@/lib/product-types";

export const revalidate = 0;

export const metadata: Metadata = {
  ...canonicalMetadata("/"),
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=1400&q=80";

async function loadPopularCategoryTiles() {
  const types = await prisma.productType.findMany({
    where: { products: { some: {} } },
    include: {
      _count: { select: { products: true } },
      products: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          gender: true,
          images: true,
          colors: { orderBy: { sortOrder: "asc" }, take: 1, select: { images: true } },
        },
      },
    },
  });

  return types
    .map((t) => {
      const preview = t.products.find((p) => p.images[0] || p.colors[0]?.images[0]);
      const image = preview?.images[0] || preview?.colors[0]?.images[0];
      if (!image) return null;
      const girlCount = t.products.filter((p) => p.gender === "GIRL").length;
      const href = isAccessoryTypeSlug(t.slug)
        ? `/category/accessories/${PRODUCT_TYPE_TO_CLUSTER[t.slug] ?? t.slug}`
        : typeClusterPath(
            t.girlOnly || girlCount >= t.products.length / 2 ? "girls" : "boys",
            t.slug
          );
      return { label: t.name, href, image, count: t._count.products };
    })
    .filter((t): t is NonNullable<typeof t> => t != null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export default async function HomePage() {
  await expireFeaturedProducts();

  const [novelties, sale, categoryTiles] = await Promise.all([
    prisma.product.findMany({
      where: activeFeaturedWhere(),
      include: { variants: true },
      orderBy: [{ featuredAt: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.product.findMany({
      where: { isSale: true },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    loadPopularCategoryTiles(),
  ]);

  return (
    <>
      <section className="bg-mint">
        <div className="container-content flex flex-col items-center gap-8 py-12 md:flex-row md:items-center md:py-14 lg:gap-16">
          <div className="max-w-xl">
            <span className="inline-block rounded-md bg-cobalt/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-cobalt">
              Розпродаж залишків
            </span>
            <h1 className="mt-5 font-display text-4xl font-black uppercase leading-[1.05] tracking-tight text-cobalt md:text-[44px]">
              Одяг для дітей 6–16 років
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-obsidian/80">
              Зручні речі з натуральних матеріалів. Доставка Новою Поштою по Україні — зараз ще й
              знижки на сезонні залишки.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <TrackedLink href="/category/sale" contentType="category" contentId="sale" className="btn-primary">
                Дивитись розпродаж
              </TrackedLink>
              <TrackedLink href="/category/new" contentType="category" contentId="new" className="btn-secondary">
                Новинки
              </TrackedLink>
            </div>
          </div>
          <div className="relative h-56 w-full overflow-hidden rounded-card md:h-72 md:max-w-md lg:h-80 lg:max-w-lg">
            <Image
              src={HERO_IMAGE}
              alt="Діти в одязі LUMI"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {novelties.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="container-content">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-cobalt">Сезон до школи</p>
                <h2 className="mt-2 font-display text-3xl font-black md:text-[38px]">Новинки</h2>
              </div>
              <Link
                href="/category/new"
                className="shrink-0 text-[15px] font-semibold text-cobalt underline-offset-4 hover:underline"
              >
                Усі новинки
              </Link>
            </div>
            <div className="mt-10">
              <ProductGrid
                products={novelties.map(toCardData)}
                columns={4}
                listId="home_new"
                listName="Новинки"
              />
            </div>
          </div>
        </section>
      )}

      {sale.length > 0 && (
        <section className={`${novelties.length > 0 ? "bg-chalk" : "bg-white"} py-16 md:py-20`}>
          <div className="container-content">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-cobalt">Залишки сезону</p>
                <h2 className="mt-2 font-display text-3xl font-black md:text-[38px]">Розпродаж</h2>
              </div>
              <Link
                href="/category/sale"
                className="shrink-0 text-[15px] font-semibold text-cobalt underline-offset-4 hover:underline"
              >
                Усі зі знижкою
              </Link>
            </div>
            <div className="mt-10">
              <ProductGrid
                products={sale.map(toCardData)}
                columns={4}
                listId="home_sale"
                listName="Розпродаж"
              />
            </div>
          </div>
        </section>
      )}

      {categoryTiles.length > 0 && (
        <section className="py-20">
          <div className="container-content">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-cobalt">Обирай стиль</p>
                <h2 className="mt-2 font-display text-3xl font-black md:text-[38px]">Популярні категорії</h2>
              </div>
              <TrackedLink
                href="/category/girls"
                contentType="category"
                contentId="girls"
                className="hidden text-[15px] font-semibold text-cobalt underline-offset-4 hover:underline sm:block"
              >
                Дивитись все
              </TrackedLink>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categoryTiles.map((tile) => (
                <TrackedLink
                  key={tile.href}
                  href={tile.href}
                  contentType="category"
                  contentId={tile.label}
                  className="group relative h-[400px] overflow-hidden rounded-card"
                >
                  <Image
                    src={tile.image}
                    alt={tile.label}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-6 bottom-6 flex items-center justify-between rounded-xl bg-white/95 px-5 py-4 backdrop-blur">
                    <span className="text-lg font-bold">{tile.label}</span>
                    <ArrowRightIcon className="h-[18px] w-[18px] text-cobalt transition group-hover:translate-x-1" />
                  </span>
                </TrackedLink>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
