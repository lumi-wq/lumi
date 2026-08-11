/**
 * Upsert catalog product types into the current database (no full reseed).
 * Usage: npx tsx scripts/ensure-product-types.mjs
 */
import { PrismaClient } from "@prisma/client";

const TYPES = [
  { slug: "outerwear", name: "Верхній одяг", sortOrder: 10, girlOnly: false },
  { slug: "sportswear", name: "Спортивні костюми", sortOrder: 20, girlOnly: false },
  { slug: "tshirts", name: "Футболки", sortOrder: 30, girlOnly: false },
  { slug: "pants", name: "Штани", sortOrder: 40, girlOnly: false },
  { slug: "dresses", name: "Сукні", sortOrder: 50, girlOnly: true },
  { slug: "footwear", name: "Взуття", sortOrder: 60, girlOnly: false },
  { slug: "accessories", name: "Аксесуари", sortOrder: 70, girlOnly: false },
];

const prisma = new PrismaClient();

async function main() {
  for (const t of TYPES) {
    await prisma.productType.upsert({
      where: { slug: t.slug },
      create: t,
      update: { name: t.name, sortOrder: t.sortOrder, girlOnly: t.girlOnly },
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
