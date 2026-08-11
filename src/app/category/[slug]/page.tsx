import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { ProductGender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toCardData } from "@/lib/types";
import { productCountLabel } from "@/lib/format";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FiltersPanel } from "@/components/catalog/FiltersPanel";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Pagination } from "@/components/catalog/Pagination";

const PAGE_SIZE = 9;

const VIRTUAL_CATEGORIES: Record<string, { slug: string; name: string; description: string }> = {
  new: {
    slug: "new",
    name: "Новинки",
    description: "Свіжі надходження LUMI — нові моделі та кольори щотижня.",
  },
  sale: {
    slug: "sale",
    name: "Розпродаж",
    description: "Великі знижки на залишки сезону — поки є розміри.",
  },
};

type SearchParams = {
  gender?: string;
  type?: string;
  sizes?: string;
  sort?: string;
  page?: string;
};

function parseGender(value?: string): ProductGender | undefined {
  if (value === "BOY" || value === "GIRL") return value;
  return undefined;
}

async function getCategory(slug: string) {
  if (slug in VIRTUAL_CATEGORIES) return VIRTUAL_CATEGORIES[slug];
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
  const isVirtualSale = params.slug === "sale";
  const categoryId = "id" in category ? category.id : undefined;

  const gender = parseGender(searchParams.gender);
  const typeSlug = searchParams.type?.trim() || undefined;
  const sizes = searchParams.sizes?.split(",").filter(Boolean) ?? [];
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const productType = typeSlug
    ? await prisma.productType.findUnique({ where: { slug: typeSlug } })
    : null;

  // Сукні лише для дівчаток — ігноруємо type=dresses при gender=BOY
  const typeAllowed =
    productType &&
    !(productType.girlOnly && gender === "BOY")
      ? productType
      : null;

  const where: Prisma.ProductWhereInput = {
    ...(categoryId ? { categoryId } : {}),
    ...(isVirtualSale ? { isSale: true } : {}),
    ...(gender ? { gender } : {}),
    ...(typeAllowed ? { productTypeId: typeAllowed.id } : {}),
    ...(sizes.length ? { variants: { some: { size: { in: sizes } } } } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    searchParams.sort === "price-asc"
      ? [{ price: "asc" }]
      : searchParams.sort === "price-desc"
        ? [{ price: "desc" }]
        : searchParams.sort === "newest" || isVirtualNew
          ? [{ createdAt: "desc" }]
          : isVirtualSale
            ? [{ price: "asc" }]
            : [{ isFeatured: "desc" }, { rating: "desc" }];

  const baseFacetWhere: Prisma.ProductWhereInput = {
    ...(categoryId ? { categoryId } : {}),
    ...(isVirtualSale ? { isSale: true } : {}),
    ...(gender ? { gender } : {}),
    ...(typeAllowed ? { productTypeId: typeAllowed.id } : {}),
  };

  const [total, products, facetVariants, productTypes] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      include: { variants: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.productVariant.findMany({
      where: { product: baseFacetWhere },
      select: { size: true },
      distinct: ["size"],
    }),
    prisma.productType.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const facetSizes = Array.from(new Set(facetVariants.map((v) => v.size))).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const headline =
    params.slug === "teens"
      ? gender === "BOY"
        ? "Підлітки · Хлопчики"
        : gender === "GIRL"
          ? "Підлітки · Дівчатка"
          : "Базові речі для підлітків"
      : params.slug === "kids"
        ? gender === "BOY"
          ? "Малюки · Хлопчики"
          : gender === "GIRL"
            ? "Малюки · Дівчатка"
            : "Одяг для малюків"
        : params.slug === "sale"
          ? "Розпродаж залишків"
          : category.name;

  const crumbs = [
    category.name,
    gender === "BOY" ? "Хлопчики" : gender === "GIRL" ? "Дівчатка" : null,
    typeAllowed?.name ?? null,
  ].filter(Boolean);

  return (
    <>
      <section className="bg-white">
        <div className="container-content py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/50">
            Колекція / {crumbs.join(" / ")}
          </p>
          <h1 className="mt-3 font-display text-3xl font-black md:text-[40px]">
            {typeAllowed ? typeAllowed.name : headline}
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
            productTypes={productTypes.map((t) => ({
              slug: t.slug,
              name: t.name,
              girlOnly: t.girlOnly,
            }))}
          />
          <div className="flex-1">
            {products.length > 0 ? (
              <>
                <ProductGrid products={products.map(toCardData)} />
                <Pagination page={page} totalPages={totalPages} />
              </>
            ) : (
              <div className="rounded-card bg-white p-16 text-center">
                <h3 className="font-display text-xl font-bold">Оновлюємо асортимент</h3>
                <p className="mt-2 text-sm text-obsidian/60">
                  Товари скоро зʼявляться — ми якраз наповнюємо каталог.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
