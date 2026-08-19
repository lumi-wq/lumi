"use client";

import { useEffect } from "react";
import type { ProductCardData } from "@/lib/types";
import { productItem, trackViewItemList } from "@/lib/ga";

export function ViewItemListTracker({
  products,
  listId,
  listName,
}: {
  products: ProductCardData[];
  listId: string;
  listName: string;
}) {
  useEffect(() => {
    trackViewItemList(
      products.map((p, index) =>
        productItem({
          id: p.id,
          name: p.name,
          price: p.price,
          index,
          listId,
          listName,
        })
      ),
      listId,
      listName
    );
  }, [products, listId, listName]);

  return null;
}
