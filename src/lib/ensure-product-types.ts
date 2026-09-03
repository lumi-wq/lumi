import { prisma } from "@/lib/prisma";
import { PRODUCT_TYPE_DEFS, productTypeDbFields } from "@/lib/product-types";

/** Upsert каталожних типів, щоб нові (напр. Комплекти) з’являлись у адмінці без reseeding. */
export async function ensureProductTypes() {
  for (const t of PRODUCT_TYPE_DEFS) {
    const row = productTypeDbFields(t);
    await prisma.productType.upsert({
      where: { slug: t.slug },
      create: row,
      update: {
        name: row.name,
        sortOrder: row.sortOrder,
        girlOnly: row.girlOnly,
        unisex: row.unisex,
      },
    });
  }
}
