/** Shared catalog product types (категорії товарів). */
export const PRODUCT_TYPE_DEFS = [
  { slug: "outerwear", name: "Верхній одяг", sortOrder: 10, girlOnly: false },
  { slug: "sportswear", name: "Спортивні костюми", sortOrder: 20, girlOnly: false },
  { slug: "tshirts", name: "Футболки", sortOrder: 30, girlOnly: false },
  { slug: "pants", name: "Штани", sortOrder: 40, girlOnly: false },
  { slug: "dresses", name: "Сукні", sortOrder: 50, girlOnly: true },
  { slug: "footwear", name: "Взуття", sortOrder: 60, girlOnly: false },
  { slug: "accessories", name: "Аксесуари", sortOrder: 70, girlOnly: false },
] as const;

export type ProductTypeDef = (typeof PRODUCT_TYPE_DEFS)[number];
