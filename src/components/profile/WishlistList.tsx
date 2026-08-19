"use client";

import { useEffect, useState } from "react";
import type { ProductCardData } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { HeartIcon } from "@/components/Icons";
import { productItem, trackRemoveFromWishlist, trackViewItemList } from "@/lib/ga";

export type WishlistEntry = {
  id: string;
  productId: string;
  product: ProductCardData;
};

export function WishlistList({
  initial,
  columns = 3,
}: {
  initial: WishlistEntry[];
  columns?: 2 | 3;
}) {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    if (initial.length === 0) return;
    trackViewItemList(
      initial.map((item, index) =>
        productItem({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          index,
          listId: "wishlist",
          listName: "Обране",
        })
      ),
      "wishlist",
      "Обране"
    );
  }, [initial]);

  const remove = async (item: WishlistEntry) => {
    trackRemoveFromWishlist(
      productItem({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
      })
    );
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: item.productId }),
    }).catch(() => setItems(initial));
  };

  if (items.length === 0) {
    return <p className="text-sm text-obsidian/60">Тут зʼявляться збережені товари.</p>;
  }

  return (
    <div
      className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
        columns === 3 ? "lg:grid-cols-3" : ""
      }`}
    >
      {items.map((item) => (
        <div key={item.id} className="relative">
          <button
            type="button"
            onClick={() => remove(item)}
            aria-label={`Прибрати ${item.product.name} з обраного`}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-cobalt shadow-sm transition hover:scale-105"
          >
            <HeartIcon className="h-5 w-5" filled />
          </button>
          <ProductCard
            product={item.product}
            listId="wishlist"
            listName="Обране"
          />
        </div>
      ))}
    </div>
  );
}
