/** Shared catalog product types (категорії товарів). */
export const PRODUCT_TYPE_DEFS = [
  { slug: "outerwear", name: "Верхній одяг", sortOrder: 10, girlOnly: false, unisex: false },
  { slug: "sportswear", name: "Спортивні костюми", sortOrder: 20, girlOnly: false, unisex: false },
  { slug: "suits", name: "Костюми", sortOrder: 25, girlOnly: false, unisex: false },
  { slug: "tshirts", name: "Футболки", sortOrder: 30, girlOnly: false, unisex: false },
  { slug: "pants", name: "Штани", sortOrder: 40, girlOnly: false, unisex: false },
  { slug: "shorts", name: "Шорти", sortOrder: 45, girlOnly: false, unisex: false },
  { slug: "dresses", name: "Сукні", sortOrder: 50, girlOnly: true, unisex: false },
  { slug: "footwear", name: "Взуття", sortOrder: 60, girlOnly: false, unisex: false },
  { slug: "hats", name: "Шапки", sortOrder: 70, girlOnly: false, unisex: false },
  { slug: "caps", name: "Кепки", sortOrder: 75, girlOnly: false, unisex: false },
  { slug: "bags", name: "Сумки", sortOrder: 80, girlOnly: false, unisex: false },
  { slug: "glasses", name: "Окуляри", sortOrder: 90, girlOnly: false, unisex: true },
] as const;

export type ProductTypeDef = (typeof PRODUCT_TYPE_DEFS)[number];

/** Підкатегорії розділу «Аксесуари». */
export const ACCESSORY_TYPE_SLUGS = ["hats", "caps", "bags", "glasses"] as const;

export type AccessoryTypeSlug = (typeof ACCESSORY_TYPE_SLUGS)[number];

export function isAccessoryTypeSlug(slug: string): slug is AccessoryTypeSlug {
  return (ACCESSORY_TYPE_SLUGS as readonly string[]).includes(slug);
}
