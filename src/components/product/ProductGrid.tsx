import type { ProductCardData } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { ViewItemListTracker } from "@/components/analytics/ViewItemListTracker";

export function ProductGrid({
  products,
  columns = 3,
  listId,
  listName,
}: {
  products: ProductCardData[];
  columns?: 3 | 4;
  listId?: string;
  listName?: string;
}) {
  return (
    <>
      {listId && listName && (
        <ViewItemListTracker products={products} listId={listId} listName={listName} />
      )}
      <div
        className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
          columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
        }`}
      >
        {products.map((p, index) => (
          <ProductCard
            key={p.id}
            product={p}
            index={index}
            listId={listId}
            listName={listName}
          />
        ))}
      </div>
    </>
  );
}
