import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toCardData } from "@/lib/types";
import { productCountLabel } from "@/lib/format";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FiltersPanel } from "@/components/catalog/FiltersPanel";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Pagination } from "@/components/catalog/Pagination";

const PAGE_SIZE = 9;

// Віртуальна категорія "Новинки" поверх реальних категорій із БД
const NEW_CATEGORY = {
  slug: "new",
  name: "Новинки",
  description: "Свіжі надходження LUMI — нові моделі та кольори щотижня.",
};

type SearchParams = {
  sizes?: string;
  colors?: string;
  max?: string;
  sort?: string;
  page?: string;
};

async function getCategory(slug: string) {
  if (slug === "new") return NEW_CATEGORY;
  return prisma.category.findUnique({ where: { slug } });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await getCategory(params.slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
    openGraph: { title: `${category.name} | LUMI`, description: category.description },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: SearchParams;
}) {
  const category = await getCategory(params.slug);
  if (!category) notFound();

  const isVirtualNew = params.slug === "new";
  const categoryId = "id" in category ? category.id : undefined;

  const sizes = searchParams.sizes?.split(",").filter(Boolean) ?? [];
  const colors = searchParams.colors?.split(",").filter(Boolean) ?? [];
  const max = searchParams.max ? Number(searchParams.max) : undefined;
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const variantFilter: Prisma.ProductVariantWhereInput = {};
  if (sizes.length) variantFilter.size = { in: sizes };
  if (colors.length) variantFilter.color = { in: colors };

  const where: Prisma.ProductWhereInput = {
    ...(categoryId ? { categoryId } : {}),
    ...(max ? { price: { lte: max } } : {}),
    ...(sizes.length || colors.length ? { variants: { some: variantFilter } } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    searchParams.sort === "price-asc"
      ? [{ price: "asc" }]
      : searchParams.sort === "price-desc"
        ? [{ price: "desc" }]
        : searchParams.sort === "newest" || isVirtualNew
          ? [{ createdAt: "desc" }]
          : [{ isFeatured: "desc" }, { rating: "desc" }];

  const [total, products, facetVariants, priceAgg] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      include: { variants: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.productVariant.findMany({
      where: categoryId ? { product: { categoryId } } : {},
      select: { size: true, color: true, colorHex: true },
      distinct: ["size", "color"],
    }),
    prisma.product.aggregate({
      where: categoryId ? { categoryId } : {},
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  const facetSizes = Array.from(new Set(facetVariants.map((v) => v.size))).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );
  const facetColors = Array.from(
    facetVariants
      .reduce((map, v) => map.set(v.color, v.colorHex), new Map<string, string>())
      .entries()
  ).map(([color, colorHex]) => ({ color, colorHex }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <section className="bg-white">
        <div className="container-content py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/50">
            Колекція / {category.name}
          </p>
          <h1 className="mt-3 font-display text-3xl font-black md:text-[40px]">
            {params.slug === "teens" ? "Базові речі для підлітків" : category.name}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-obsidian/70">
            {category.description}
          </p>
        </div>
      </section>

      <section className="border-y border-black/5 bg-chalk">
        <div className="container-content flex items-center justify-between py-3 text-sm">
          <p className="text-obsidian/70">
            Показано {from}-{to} з {productCountLabel(total)}
          </p>
          <SortSelect />
        </div>
      </section>

      <section className="py-12">
        <div className="container-content flex flex-col gap-10 lg:flex-row">
          <FiltersPanel
            sizes={facetSizes}
            colors={facetColors}
            priceMin={priceAgg._min.price ?? 0}
            priceMax={priceAgg._max.price ?? 3000}
          />
          <div className="flex-1">
            {products.length > 0 ? (
              <>
                <ProductGrid products={products.map(toCardData)} />
                <Pagination page={page} totalPages={totalPages} />
              </>
            ) : (
              <div className="rounded-card bg-white p-16 text-center">
                <h3 className="font-display text-xl font-bold">За цими фільтрами нічого немає</h3>
                <p className="mt-2 text-sm text-obsidian/60">
                  Спробуйте змінити розмір, колір або ціновий діапазон.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
