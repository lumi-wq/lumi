/**
 * Уніфікує категорії під асортимент 6–16 (без «Малюки»).
 * Безпечно для вже наповненої БД: переносить товари, оновлює назви.
 *
 * Usage: node --env-file=.env.local scripts/ensure-catalog-6-16.mjs
 *    or: DATABASE_URL=... node scripts/ensure-catalog-6-16.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const catalog = await prisma.category.upsert({
    where: { slug: "kidswear" },
    create: {
      slug: "kidswear",
      name: "Одяг 6–16",
      description: "Зручний одяг з натуральних тканин для дітей віком від 6 до 16 років.",
      ageRange: "6-16",
    },
    update: {
      name: "Одяг 6–16",
      description: "Зручний одяг з натуральних тканин для дітей віком від 6 до 16 років.",
      ageRange: "6-16",
    },
  });

  for (const slug of ["teens", "kids"]) {
    const old = await prisma.category.findUnique({ where: { slug } });
    if (!old || old.id === catalog.id) continue;
    const moved = await prisma.product.updateMany({
      where: { categoryId: old.id },
      data: { categoryId: catalog.id },
    });
    console.log(`Moved ${moved.count} products from ${slug} → kidswear`);
    await prisma.category.delete({ where: { id: old.id } });
    console.log(`Deleted category ${slug}`);
  }

  console.log("Catalog ready:", catalog.slug, catalog.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
