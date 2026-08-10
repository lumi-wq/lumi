import { prisma } from "@/lib/prisma";
import { ProductsManager } from "@/components/admin/ProductsManager";

export default async function AdminProductsPage() {
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  return (
    <div>
      <h1 className="font-display text-2xl font-black">Товари</h1>
      <ProductsManager categories={categories} />
    </div>
  );
}
