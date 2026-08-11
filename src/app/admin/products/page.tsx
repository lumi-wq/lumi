import { prisma } from "@/lib/prisma";
import { ProductsManager } from "@/components/admin/ProductsManager";

export default async function AdminProductsPage() {
  const [categories, productTypes] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.productType.findMany({
      select: { id: true, name: true, slug: true, girlOnly: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  return (
    <div>
      <h1 className="font-display text-2xl font-black">Товари</h1>
      <ProductsManager categories={categories} productTypes={productTypes} />
    </div>
  );
}
