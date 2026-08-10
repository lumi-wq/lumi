"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { HeartIcon } from "@/components/Icons";

type Item = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
};

export function WishlistList({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);

  const remove = async (item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: item.productId }),
    }).catch(() => setItems(initial));
  };

  if (items.length === 0) {
    return <p className="mt-5 text-sm text-obsidian/60">Тут з&#39;являться збережені товари.</p>;
  }

  return (
    <ul className="mt-5 space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-4">
          <Link
            href={`/product/${item.slug}`}
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mint/50"
          >
            {item.image && (
              <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/product/${item.slug}`} className="block truncate text-sm font-bold hover:text-cobalt">
              {item.name}
            </Link>
            <p className="text-[13px] text-obsidian/60">{formatPrice(item.price)}</p>
          </div>
          <button
            onClick={() => remove(item)}
            aria-label={`Прибрати ${item.name} з обраного`}
            className="text-cobalt transition hover:scale-110"
          >
            <HeartIcon className="h-5 w-5" filled />
          </button>
        </li>
      ))}
    </ul>
  );
}
