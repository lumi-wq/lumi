import { isFeaturedActive } from "@/lib/featured";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  tag: string | null;
  tagStyle: string | null;
  isSale: boolean;
  isFeatured: boolean;
  colors: { color: string; colorHex: string }[];
  defaultVariant: { id: string; size: string; color: string } | null;
};

export type ProductWithVariants = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  tag: string | null;
  tagStyle: string | null;
  isSale: boolean;
  isFeatured?: boolean;
  featuredAt?: Date | string | null;
  variants: { id: string; size: string; color: string; colorHex: string; stock: number }[];
};

export function toCardData(p: ProductWithVariants): ProductCardData {
  const seenColors = new Map<string, string>();
  for (const v of p.variants) {
    const hex = v.colorHex.toUpperCase();
    if (!seenColors.has(hex)) seenColors.set(hex, hex);
  }
  const firstInStock = p.variants.find((v) => v.stock > 0) ?? p.variants[0] ?? null;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    image: p.images[0] ?? "",
    tag: p.tag,
    tagStyle: p.tagStyle,
    isSale: p.isSale,
    isFeatured: isFeaturedActive({
      isFeatured: Boolean(p.isFeatured),
      featuredAt: p.featuredAt,
    }),
    colors: Array.from(seenColors, ([color, colorHex]) => ({ color, colorHex })).slice(0, 4),
    defaultVariant: firstInStock
      ? { id: firstInStock.id, size: firstInStock.size, color: firstInStock.colorHex }
      : null,
  };
}
