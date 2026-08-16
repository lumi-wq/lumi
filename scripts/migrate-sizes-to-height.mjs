/**
 * Мігрує ProductVariant.size з віку («12 років») на ріст («152 см»).
 *
 * Usage: node --env-file=.env.local scripts/migrate-sizes-to-height.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AGE_TO_CM = {
  "6 років": 116,
  "7 років": 122,
  "8 років": 128,
  "9 років": 134,
  "10 років": 140,
  "11 років": 146,
  "12 років": 152,
  "13 років": 158,
  "14 років": 164,
  "15 років": 170,
  "16 років": 176,
};

async function main() {
  const variants = await prisma.productVariant.findMany({ select: { id: true, size: true } });
  let updated = 0;
  let skipped = 0;

  for (const v of variants) {
    const cm = AGE_TO_CM[v.size];
    if (cm == null) {
      skipped++;
      continue;
    }
    const next = `${cm} см`;
    if (v.size === next) {
      skipped++;
      continue;
    }
    await prisma.productVariant.update({ where: { id: v.id }, data: { size: next } });
    updated++;
  }

  // OrderItem snapshots — теж оновлюємо для консистентності в історії
  const items = await prisma.orderItem.findMany({ select: { id: true, size: true } });
  let itemsUpdated = 0;
  for (const item of items) {
    const cm = AGE_TO_CM[item.size];
    if (cm == null) continue;
    await prisma.orderItem.update({ where: { id: item.id }, data: { size: `${cm} см` } });
    itemsUpdated++;
  }

  console.log(`Variants updated: ${updated}, skipped: ${skipped}`);
  console.log(`Order items updated: ${itemsUpdated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
