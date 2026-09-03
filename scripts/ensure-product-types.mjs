/**
 * Upsert catalog product types into the current database (no full reseed).
 * Also migrates legacy `accessories` products → `hats`.
 * Usage: node scripts/ensure-product-types.mjs
 */
import { PrismaClient } from "@prisma/client";

const TYPES = [
  { slug: "outerwear", name: "Верхній одяг", sortOrder: 10, girlOnly: false, unisex: false },
  { slug: "sportswear", name: "Спортивні костюми", sortOrder: 20, girlOnly: false, unisex: false },
  { slug: "suits", name: "Костюми", sortOrder: 25, girlOnly: false, unisex: false },
  { slug: "sets", name: "Комплекти", sortOrder: 28, girlOnly: false, unisex: false },
  { slug: "tshirts", name: "Футболки", sortOrder: 30, girlOnly: false, unisex: false },
  { slug: "shirts", name: "Сорочки", sortOrder: 32, girlOnly: false, unisex: false },
  { slug: "pants", name: "Штани", sortOrder: 40, girlOnly: false, unisex: false },
  { slug: "shorts", name: "Шорти", sortOrder: 45, girlOnly: false, unisex: false },
  { slug: "dresses", name: "Сукні", sortOrder: 50, girlOnly: true, unisex: false },
  { slug: "footwear", name: "Взуття", sortOrder: 60, girlOnly: false, unisex: false },
  { slug: "hats", name: "Шапки", sortOrder: 70, girlOnly: false, unisex: false },
  { slug: "caps", name: "Кепки", sortOrder: 75, girlOnly: false, unisex: false },
  { slug: "bags", name: "Сумки", sortOrder: 80, girlOnly: false, unisex: false },
  { slug: "glasses", name: "Окуляри", sortOrder: 90, girlOnly: false, unisex: true },
];

const prisma = new PrismaClient();

async function main() {
  for (const t of TYPES) {
    await prisma.productType.upsert({
      where: { slug: t.slug },
      create: t,
      update: {
        name: t.name,
        sortOrder: t.sortOrder,
        girlOnly: t.girlOnly,
        unisex: t.unisex,
      },
    });
  }

  const legacy = await prisma.productType.findUnique({ where: { slug: "accessories" } });
  const hats = await prisma.productType.findUnique({ where: { slug: "hats" } });
  if (legacy && hats) {
    const moved = await prisma.product.updateMany({
      where: { productTypeId: legacy.id },
      data: { productTypeId: hats.id },
    });
    if (moved.count > 0) {
      console.log(`Migrated ${moved.count} products from accessories → hats`);
    }
    await prisma.productType.delete({ where: { id: legacy.id } }).catch(() => {
      console.warn("Could not delete legacy accessories type (still referenced?)");
    });
  }

  const count = await prisma.productType.count();
  console.log(`Product types ready: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
