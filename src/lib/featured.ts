import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Скільки днів товар лишається в «Новинках» після відмітки. */
export const FEATURED_DAYS = 30;

export function featuredSince(): Date {
  return new Date(Date.now() - FEATURED_DAYS * 24 * 60 * 60 * 1000);
}

/** Prisma where: активна новинка (відмітка + не старша за FEATURED_DAYS). */
export function activeFeaturedWhere(): Prisma.ProductWhereInput {
  return {
    isFeatured: true,
    featuredAt: { gte: featuredSince() },
  };
}

export function isFeaturedActive(p: {
  isFeatured: boolean;
  featuredAt?: Date | string | null;
}): boolean {
  if (!p.isFeatured || !p.featuredAt) return false;
  const at = p.featuredAt instanceof Date ? p.featuredAt : new Date(p.featuredAt);
  return at >= featuredSince();
}

/** Знімає прострочені відмітки «Новинки». */
export async function expireFeaturedProducts(): Promise<number> {
  try {
    const result = await prisma.product.updateMany({
      where: {
        isFeatured: true,
        OR: [{ featuredAt: null }, { featuredAt: { lt: featuredSince() } }],
      },
      data: { isFeatured: false, featuredAt: null },
    });
    return result.count;
  } catch (err) {
    // Stale Prisma client / schema drift у dev не повинен валити каталог
    console.error("[expireFeaturedProducts]", err);
    return 0;
  }
}
