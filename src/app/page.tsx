import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toCardData } from "@/lib/types";
import { ProductGrid } from "@/components/product/ProductGrid";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { ArrowRightIcon } from "@/components/Icons";

export const revalidate = 60;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=1400&q=80";

const CATEGORY_TILES = [
  {
    label: "Спортивний одяг",
    href: "/search?q=active",
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Верхній одяг",
    href: "/search?q=куртка",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Трикотаж",
    href: "/search?q=светр",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
  },
];

const LIFESTYLE = [
  "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1476234251651-f353703a034d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=600&q=80",
];

export default async function HomePage() {
  const [featured, sale] = await Promise.all([
    prisma.product.findMany({
      where: { isFeatured: true },
      include: { variants: true },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    prisma.product.findMany({
      where: { isSale: true },
      include: { variants: true },
      orderBy: { price: "asc" },
      take: 6,
    }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-mint">
        <div className="grid lg:grid-cols-2">
          <div className="flex items-center px-5 py-16 md:px-10 lg:px-20 lg:py-24">
            <div className="max-w-xl">
              <span className="inline-block rounded-md bg-cobalt/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-cobalt">
                Розпродаж залишків
              </span>
              <h1 className="mt-6 font-display text-4xl font-black uppercase leading-[1.05] tracking-tight text-cobalt md:text-[56px]">
                Великі знижки на улюблені моделі
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-obsidian/80">
                Сезонні залишки з помітними знижками — поки є розміри. Зручний одяг з натуральних матеріалів.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/category/sale" className="btn-primary">
                  Дивитись розпродаж
                </Link>
                <Link href="/category/new" className="btn-secondary">
                  Новинки
                </Link>
              </div>
            </div>
          </div>
          <div className="relative min-h-[320px] lg:min-h-[640px]">
            <Image
              src={HERO_IMAGE}
              alt="Діти в одязі LUMI"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Розпродаж */}
      {sale.length > 0 && (
        <section className="bg-white py-20">
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
              <ProductGrid products={sale.map(toCardData)} />
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

      {/* Найпопулярніші товари */}
      <section className="bg-white py-20">
        <div className="container-content">
          <p className="text-sm font-semibold uppercase tracking-widest text-cobalt">Хіти продажів</p>
          <h2 className="mt-2 font-display text-3xl font-black md:text-[38px]">
            Найпопулярніші товари Lumi
          </h2>
          <div className="mt-10">
            <ProductGrid products={featured.map(toCardData)} />
          </div>
        </div>
      </section>

      {/* Lifestyle */}
      <section className="py-20">
        <div className="container-content">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-3xl font-black md:text-[38px]">Як носять наші клієнти</h2>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="text-[15px] font-bold text-cobalt"
            >
              @LUMISTUDIO
            </a>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-5">
            {LIFESTYLE.map((src, i) => (
              <div
                key={src}
                className={`relative h-52 overflow-hidden rounded-card md:h-60 ${
                  i === 4 ? "hidden md:block" : ""
                }`}
              >
                <Image
                  src={src}
                  alt={`Клієнт LUMI ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover transition duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Розсилка */}
      <section className="bg-chalk pb-24 pt-4">
        <div className="container-content">
          <div className="rounded-3xl bg-mint px-6 py-16 text-center md:px-16">
            <h2 className="font-display text-3xl font-black md:text-4xl">Будь в курсі новинок</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-obsidian/70">
              Дізнавайся першим про нові колекції, акції та отримай знижку 10% на перше замовлення.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
