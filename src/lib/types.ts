export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  tag: string | null;
  tagStyle: string | null;
  colors: { color: string; colorHex: string }[];
  defaultVariant: { id: string; size: string; color: string } | null;
};

export type ProductWithVariants = {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: string[];
  tag: string | null;
  tagStyle: string | null;
  variants: { id: string; size: string; color: string; colorHex: string; stock: number }[];
};

export function toCardData(p: ProductWithVariants): ProductCardData {
  const seenColors = new Map<string, string>();
  for (const v of p.variants) {
    if (!seenColors.has(v.color)) seenColors.set(v.color, v.colorHex);
  }
  const firstInStock = p.variants.find((v) => v.stock > 0) ?? p.variants[0] ?? null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    image: p.images[0] ?? "",
    tag: p.tag,
    tagStyle: p.tagStyle,
    colors: Array.from(seenColors, ([color, colorHex]) => ({ color, colorHex })).slice(0, 4),
    defaultVariant: firstInStock
      ? { id: firstInStock.id, size: firstInStock.size, color: firstInStock.color }
      : null,
  };
}
