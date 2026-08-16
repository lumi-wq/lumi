/**
 * Створює ProductColor з існуючих variants і привʼязує colorId.
 * Usage: DATABASE_URL=... node scripts/migrate-product-colors.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { variants: true, colors: true },
  });

  let createdColors = 0;
  let linked = 0;

  for (const product of products) {
    const byHex = new Map();
    for (const v of product.variants) {
      const hex = (v.colorHex || "").toUpperCase();
      if (!hex) continue;
      if (!byHex.has(hex)) byHex.set(hex, []);
      byHex.get(hex).push(v);
    }

    let sortOrder = 0;
    for (const [hex, variants] of byHex) {
      let color = product.colors.find((c) => c.colorHex.toUpperCase() === hex);
      if (!color) {
        color = await prisma.productColor.create({
          data: {
            productId: product.id,
            name: hex,
            colorHex: hex,
            images: product.images.length ? product.images : [],
            sortOrder: sortOrder++,
          },
        });
        createdColors++;
      }

      for (const v of variants) {
        if (v.colorId === color.id) continue;
        await prisma.productVariant.update({
          where: { id: v.id },
          data: {
            colorId: color.id,
            color: color.name || hex,
            colorHex: hex,
          },
        });
        linked++;
      }
    }
  }

  console.log(`Colors created: ${createdColors}, variants linked: ${linked}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
