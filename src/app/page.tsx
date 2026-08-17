import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toCardData } from "@/lib/types";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ArrowRightIcon } from "@/components/Icons";
import { canonicalMetadata } from "@/lib/seo";

export const revalidate = 0;

export const metadata: Metadata = {
  ...canonicalMetadata("/"),
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=1400&q=80";

const CATEGORY_TILES = [
  {
    label: "Спортивний одяг",
    href: "/category/sportyvni-kostyumy",
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Верхній одяг",
    href: "/category/verkhniy-odyag",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Футболки",
    href: "/category/futbolky",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
  },
];

export default async function HomePage() {
  const sale = await prisma.product.findMany({
    where: { isSale: true },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

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
              <Link href="/category/sale" className="btn-primary">
                Дивитись розпродаж
              </Link>
              <Link href="/category/new" className="btn-secondary">
                Новинки
              </Link>
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

      {sale.length > 0 && (
        <section className="bg-white py-16 md:py-20">
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
              <ProductGrid products={sale.map(toCardData)} columns={4} />
            </div>
          </div>
        </section>
      )}

      {/* Популярні категорії */}
      <section className="py-20">
        <div className="container-content">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-cobalt">Обирай стиль</p>
              <h2 className="mt-2 font-display text-3xl font-black md:text-[38px]">Популярні категорії</h2>
            </div>
            <Link
              href="/category/new"
              className="hidden text-[15px] font-semibold text-cobalt underline-offset-4 hover:underline sm:block"
            >
              Дивитись все
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {CATEGORY_TILES.map((tile) => (
              <Link
                key={tile.label}
                href={tile.href}
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
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
