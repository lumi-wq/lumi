"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/store/cart";
import type { ProductCardData } from "@/lib/types";
import { productItem, trackAddToCart, trackSelectItem, variantLabel } from "@/lib/ga";
import { Tag } from "./Tag";
import { ProductPrice } from "./ProductPrice";

export function ProductCard({
  product,
  index,
  listId,
  listName,
}: {
  product: ProductCardData;
  index?: number;
  listId?: string;
  listName?: string;
}) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  const item = productItem({
    id: product.id,
    name: product.name,
    price: product.price,
    variant: product.defaultVariant
      ? variantLabel(product.defaultVariant.size, product.defaultVariant.color)
      : undefined,
    index,
    listId,
    listName,
  });

  const onSelect = () => trackSelectItem(item, listId, listName);

  const quickAdd = () => {
    if (!product.defaultVariant) return;
    add({
      variantId: product.defaultVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      color: product.defaultVariant.color,
      size: product.defaultVariant.size,
      price: product.price,
    });
    trackAddToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const badge = product.isSale
    ? { label: "Розпродаж", style: "dark" as const }
    : product.isFeatured
      ? { label: "Новинка", style: "cobalt" as const }
      : product.tag
        ? { label: product.tag, style: product.tagStyle }
        : null;

  return (
    <article className="group overflow-hidden rounded-card bg-white shadow-sm transition hover:shadow-md">
      <Link
        href={`/product/${product.slug}`}
        onClick={onSelect}
        className="relative block h-[320px] overflow-hidden bg-mint/40"
      >
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        {badge && (
          <span className="absolute left-3 top-3">
            <Tag label={badge.label} style={badge.style} />
          </span>
        )}
      </Link>
      <div className="space-y-3 p-4">
        <div>
          <Link
            href={`/product/${product.slug}`}
            onClick={onSelect}
            className="text-base font-medium hover:text-cobalt"
          >
            {product.name}
          </Link>
          <ProductPrice
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            className="mt-1"
          />
        </div>
        {product.colors.length > 0 && (
          <div className="flex gap-1.5">
            {product.colors.map((c) => (
              <span
                key={c.colorHex}
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ backgroundColor: c.colorHex }}
              />
            ))}
          </div>
        )}
        <button
          onClick={quickAdd}
          disabled={!product.defaultVariant}
          className="w-full rounded-lg bg-cobalt py-2.5 text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-[#2E00CC] disabled:opacity-50"
        >
          {added ? "Додано ✓" : "Додати +"}
        </button>
      </div>
    </article>
  );
}
