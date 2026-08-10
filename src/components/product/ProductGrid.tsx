import type { ProductCardData } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  columns = 3,
}: {
  products: ProductCardData[];
  columns?: 3 | 4;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
        columns === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3"
      }`}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
