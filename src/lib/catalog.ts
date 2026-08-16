import type { Prisma } from "@prisma/client";
import { ProductGender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { compareSizes } from "@/lib/sizes";
import { ACCESSORY_TYPE_SLUGS } from "@/lib/product-types";
import { activeFeaturedWhere, expireFeaturedProducts } from "@/lib/featured";
import { DEFAULT_FAQ, type SeoFaq, type SeoLanding } from "@/lib/seo-landings";
import type { ProductWithVariants } from "@/lib/types";

export const CATALOG_PAGE_SIZE = 9;

export type CatalogCollection = {
  slug: string;
  path: string;
  name: string;
  h1: string;
  description: string;
  intro?: string;
  gender?: ProductGender;
  productTypeSlug?: string;
  productTypeSlugs?: readonly string[];
  sizes?: readonly string[];
  categoryId?: string;
  isNew?: boolean;
  isSale?: boolean;
  isAccessories?: boolean;
  faq?: SeoFaq[];
  related?: { href: string; label: string }[];
};

export const BASE_COLLECTIONS: Record<string, CatalogCollection> = {
  new: {
    slug: "new",
    path: "/category/new",
    name: "Новинки",
    h1: "Новинки",
    description: "Свіжі надходження LUMI — одяг для дітей 6–16 років.",
    intro:
      "Нові моделі одягу для дівчаток і хлопчиків. Дивіться наявні рости й замовляйте з доставкою Новою Поштою по Україні.",
    isNew: true,
    related: [
      { href: "/category/girls", label: "Дівчатка" },
      { href: "/category/boys", label: "Хлопчики" },
      { href: "/category/sale", label: "Розпродаж" },
    ],
  },
  sale: {
    slug: "sale",
    path: "/category/sale",
    name: "Розпродаж",
    h1: "Розпродаж",
    description: "Великі знижки на залишки сезону — поки є розміри.",
    intro:
      "Сезонні залишки дитячого одягу 6–16 років зі знижкою. Оплата карткою онлайн, доставка Новою Поштою.",
    isSale: true,
    related: [
      { href: "/category/new", label: "Новинки" },
      { href: "/category/girls", label: "Дівчатка" },
      { href: "/category/boys", label: "Хлопчики" },
    ],
  },
  girls: {
    slug: "girls",
    path: "/category/girls",
    name: "Дівчатка",
    h1: "Одяг для дівчаток 6–16 років",
    description: "Одяг для дівчаток 6–16 років — зручно, стильно, на кожен день.",
    intro:
      "Каталог LUMI для дівчаток: футболки, штани, сукні, верхній одяг і аксесуари. Підбір за ростом, доставка по Україні.",
    gender: "GIRL",
    faq: DEFAULT_FAQ,
    related: [
      { href: "/category/girls/verkhniy-odyag", label: "Верхній одяг" },
      { href: "/category/girls/shkilnyy-odyag", label: "Шкільний одяг" },
      { href: "/category/girls/6-8-rokiv", label: "6–8 років" },
      { href: "/category/girls/13-16-rokiv", label: "13–16 років" },
    ],
  },
  boys: {
    slug: "boys",
    path: "/category/boys",
    name: "Хлопчики",
    h1: "Одяг для хлопчиків 6–16 років",
    description: "Одяг для хлопчиків 6–16 років — база, спорт і верхній одяг.",
    intro:
      "Каталог LUMI для хлопчиків: футболки, штани, спортивні костюми, куртки. Замовлення на сайті з доставкою Новою Поштою.",
    gender: "BOY",
    faq: DEFAULT_FAQ,
    related: [
      { href: "/category/boys/verkhniy-odyag", label: "Верхній одяг" },
      { href: "/category/boys/shkilnyy-odyag", label: "Шкільний одяг" },
      { href: "/category/boys/6-8-rokiv", label: "6–8 років" },
      { href: "/category/boys/13-16-rokiv", label: "13–16 років" },
    ],
  },
  accessories: {
    slug: "accessories",
    path: "/category/accessories",
    name: "Аксесуари",
    h1: "Аксесуари для дітей 6–16 років",
    description: "Шапки, кепки, сумки, окуляри та інші дрібниці до образу LUMI.",
    intro:
      "Шапки, кепки, сумки та окуляри. Доповніть одяг аксесуарами — доставка Новою Поштою по Україні.",
    productTypeSlugs: ACCESSORY_TYPE_SLUGS,
    isAccessories: true,
    faq: DEFAULT_FAQ,
    related: [
      { href: "/category/accessories/shapky", label: "Шапки" },
      { href: "/category/accessories/kepky", label: "Кепки" },
      { href: "/category/accessories/sumky", label: "Сумки" },
      { href: "/category/girls", label: "Одяг для дівчаток" },
    ],
  },
};

export function collectionFromLanding(landing: SeoLanding): CatalogCollection {
  return {
    slug: landing.slug,
    path: landing.path,
    name: landing.name,
    h1: landing.h1,
    description: landing.description,
    intro: landing.intro,
    gender: landing.gender,
    productTypeSlug: landing.productTypeSlug,
    productTypeSlugs: landing.productTypeSlugs,
    sizes: landing.sizes,
    isAccessories: landing.parent === "accessories",
    faq: landing.faq,
    related: landing.related,
  };
}

export function parseGender(value?: string): ProductGender | undefined {
  if (value === "BOY" || value === "GIRL") return value;
  return undefined;
}

export type CatalogSearchParams = {
  gender?: string;
  type?: string;
  sizes?: string;
  sort?: string;
  page?: string;
};

export type CatalogListing = {
  total: number;
  page: number;
  totalPages: number;
  from: number;
  to: number;
  products: ProductWithVariants[];
  facetSizes: string[];
  productTypes: {
    slug: string;
    name: string;
    girlOnly: boolean;
    unisex: boolean;
  }[];
  typeAllowed: { slug: string; name: string } | null;
  gender: ProductGender | undefined;
  selectedIsUnisex: boolean;
};

export async function loadCatalogListing(
  collection: CatalogCollection,
  searchParams: CatalogSearchParams
): Promise<CatalogListing> {
  await expireFeaturedProducts();

  const lockedGender = collection.gender;
  const lockedProductTypeSlug = collection.productTypeSlug;
  const lockedProductTypeSlugs = collection.productTypeSlugs;
  const lockedSizes = collection.sizes ? [...collection.sizes] : [];
  const isAccessories = Boolean(collection.isAccessories);

  const gender = lockedGender ?? parseGender(searchParams.gender);
  const typeSlug = lockedProductTypeSlug ?? (searchParams.type?.trim() || undefined);
  const querySizes = isAccessories ? [] : searchParams.sizes?.split(",").filter(Boolean) ?? [];
  const sizes = querySizes.length ? querySizes : lockedSizes;
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const allProductTypes = await prisma.productType.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const accessoryTypes = lockedProductTypeSlugs
    ? allProductTypes.filter((t) => lockedProductTypeSlugs.includes(t.slug))
    : [];

  const productType = typeSlug
    ? allProductTypes.find((t) => t.slug === typeSlug) ?? null
    : null;

  const typeAllowed =
    productType && !(productType.girlOnly && !productType.unisex && gender === "BOY")
      ? productType
      : null;

  const accessoryTypeIds = accessoryTypes.map((t) => t.id);
  const unisexTypeIds = allProductTypes
    .filter((t) => t.unisex || t.slug === "glasses")
    .map((t) => t.id);

  const selectedIsUnisex = Boolean(typeAllowed?.unisex || typeAllowed?.slug === "glasses");

  const genderWhere = (g: ProductGender): Prisma.ProductWhereInput => {
    if (selectedIsUnisex) return {};
    if (unisexTypeIds.length === 0) return { gender: g };
    return {
      OR: [{ gender: g }, { productTypeId: { in: unisexTypeIds } }],
    };
  };

  const typeWhere: Prisma.ProductWhereInput | undefined = (() => {
    if (typeAllowed) return { productTypeId: typeAllowed.id };
    if (lockedProductTypeSlugs) {
      const ids = accessoryTypeIds.length
        ? accessoryTypeIds
        : allProductTypes.filter((t) => lockedProductTypeSlugs.includes(t.slug)).map((t) => t.id);
      if (ids.length === 0) return { id: { in: [] } };
      return { productTypeId: { in: ids } };
    }
    if (lockedProductTypeSlug) return { id: { in: [] } };
    return undefined;
  })();

  const where: Prisma.ProductWhereInput = {
    ...(collection.categoryId ? { categoryId: collection.categoryId } : {}),
    ...(collection.isNew ? activeFeaturedWhere() : {}),
    ...(collection.isSale ? { isSale: true } : {}),
    ...(gender && !selectedIsUnisex ? genderWhere(gender) : {}),
    ...(typeWhere ?? {}),
    ...(sizes.length ? { variants: { some: { size: { in: sizes } } } } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    searchParams.sort === "price-asc"
      ? [{ price: "asc" }]
      : searchParams.sort === "price-desc"
        ? [{ price: "desc" }]
        : searchParams.sort === "newest" || collection.isNew
          ? [{ featuredAt: "desc" }, { createdAt: "desc" }]
          : collection.isSale
            ? [{ price: "asc" }]
            : [{ isFeatured: "desc" }, { createdAt: "desc" }];

  const baseFacetWhere: Prisma.ProductWhereInput = {
    ...(collection.categoryId ? { categoryId: collection.categoryId } : {}),
    ...(collection.isNew ? activeFeaturedWhere() : {}),
    ...(collection.isSale ? { isSale: true } : {}),
    ...(gender && !selectedIsUnisex ? genderWhere(gender) : {}),
    ...(typeWhere ?? {}),
    ...(lockedSizes.length && !querySizes.length
      ? { variants: { some: { size: { in: lockedSizes } } } }
      : {}),
  };

  const typesForPanel = isAccessories
    ? allProductTypes.filter((t) => ACCESSORY_TYPE_SLUGS.includes(t.slug as (typeof ACCESSORY_TYPE_SLUGS)[number]))
    : allProductTypes.filter((t) => t.slug !== "accessories");

  const [total, products, facetVariants] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      include: { variants: true },
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    prisma.productVariant.findMany({
      where: { product: baseFacetWhere },
      select: { size: true },
      distinct: ["size"],
    }),
  ]);

  const facetSizes = Array.from(new Set(facetVariants.map((v) => v.size))).sort(compareSizes);
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * CATALOG_PAGE_SIZE + 1;
  const to = Math.min(page * CATALOG_PAGE_SIZE, total);

  return {
    total,
    page,
    totalPages,
    from,
    to,
    products: products as ProductWithVariants[],
    facetSizes,
    productTypes: typesForPanel.map((t) => ({
      slug: t.slug,
      name: t.name,
      girlOnly: t.girlOnly,
      unisex: t.unisex || t.slug === "glasses",
    })),
    typeAllowed: typeAllowed ? { slug: typeAllowed.slug, name: typeAllowed.name } : null,
    gender,
    selectedIsUnisex,
  };
}

export function hasIndexableFilters(
  collection: CatalogCollection,
  searchParams: CatalogSearchParams
): boolean {
  if (!collection.gender && parseGender(searchParams.gender)) return true;
  if (!collection.productTypeSlug && !collection.productTypeSlugs && searchParams.type) return true;
  if (searchParams.sizes) return true;
  return false;
}
