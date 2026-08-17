/**
 * Backfill basePrice and recompute storefront prices.
 * Treats current price as base when basePrice is 0 (one-time migration).
 *
 *   npx tsx --env-file=.env.local scripts/recompute-storefront-prices.ts
 */
import { PrismaClient } from "@prisma/client";
import { resolveStorefrontPrices } from "../src/lib/storefront-price";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      compareAtPrice: true,
      basePrice: true,
      compareAtBasePrice: true,
    },
  });

  let updated = 0;
  for (const p of products) {
    const basePrice = p.basePrice > 0 ? p.basePrice : p.price;
    const compareAtBasePrice =
      p.compareAtBasePrice != null && p.compareAtBasePrice > 0
        ? p.compareAtBasePrice
        : p.compareAtPrice != null && p.compareAtPrice > basePrice
          ? p.compareAtPrice
          : null;

    const prices = resolveStorefrontPrices({ basePrice, compareAtBasePrice });
    if (
      prices.basePrice === p.basePrice &&
      prices.compareAtBasePrice === p.compareAtBasePrice &&
      prices.price === p.price &&
      prices.compareAtPrice === p.compareAtPrice
    ) {
      continue;
    }

    await prisma.product.update({ where: { id: p.id }, data: prices });
    updated += 1;
    console.log(`${p.name}: база ${prices.basePrice} → вітрина ${prices.price}`);
  }

  console.log(`Done. Updated ${updated}/${products.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
