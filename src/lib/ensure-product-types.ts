import { prisma } from "@/lib/prisma";
import { PRODUCT_TYPE_DEFS } from "@/lib/product-types";

/** Upsert каталожних типів, щоб нові (напр. Комплекти) з’являлись у адмінці без reseeding. */
export async function ensureProductTypes() {
  for (const t of PRODUCT_TYPE_DEFS) {
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
}
