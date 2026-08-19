"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { compareSizes } from "@/lib/sizes";
import { HeartIcon } from "@/components/Icons";
import { SizeChartModal } from "@/components/product/SizeChartModal";
import { Gallery } from "@/components/product/Gallery";
import { Tag } from "@/components/product/Tag";
import { ProductPrice } from "@/components/product/ProductPrice";
import {
  productItem,
  trackAddToCart,
  trackAddToWishlist,
  trackRemoveFromWishlist,
  trackViewItem,
  variantLabel,
} from "@/lib/ga";

export type ProductColorView = {
  id: string;
  name: string;
  colorHex: string;
  images: string[];
};

type Variant = {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  colorId: string | null;
};

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    isSale: boolean;
    isFeatured: boolean;
    tag: string | null;
    tagStyle: string | null;
    materials: string | null;
    description: string;
    fallbackImage: string;
    category?: string | null;
  };
  colors: ProductColorView[];
  variants: Variant[];
};

export function ProductDetailClient({ product, colors, variants }: Props) {
  const add = useCart((s) => s.add);

  const initialColor = colors[0] ?? null;
  const [colorId, setColorId] = useState<string | null>(initialColor?.id ?? null);
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [wishState, setWishState] = useState<"idle" | "saved">("idle");
  const [wishBusy, setWishBusy] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const selectedColor =
    colors.find((c) => c.id === colorId) ?? colors[0] ?? null;

  const galleryImages =
    selectedColor?.images?.length
      ? selectedColor.images
      : product.fallbackImage
        ? [product.fallbackImage]
        : [];

  const colorHex = selectedColor?.colorHex.toUpperCase() ?? "";

  const sizesForColor = useMemo(() => {
    const list = variants
      .filter((v) =>
        selectedColor
          ? v.colorId === selectedColor.id ||
            (!v.colorId && v.colorHex.toUpperCase() === selectedColor.colorHex.toUpperCase())
          : true
      )
      .map((v) => v.size);
    return Array.from(new Set(list)).sort(compareSizes);
  }, [variants, selectedColor]);

  useEffect(() => {
    setSize(null);
  }, [colorId]);

  useEffect(() => {
    trackViewItem(
      productItem({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
      })
    );
  }, [product.id, product.name, product.price, product.category]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wishlist")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json?.items) return;
        const saved = json.items.some(
          (i: { productId: string }) => i.productId === product.id
        );
        if (saved) setWishState("saved");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const selectedVariant = variants.find((v) => {
    if (v.size !== size) return false;
    if (selectedColor) {
      return (
        v.colorId === selectedColor.id ||
        (!v.colorId && v.colorHex.toUpperCase() === selectedColor.colorHex.toUpperCase())
      );
    }
    return v.colorHex.toUpperCase() === colorHex;
  });

  const sizeAvailable = (s: string) =>
    variants.some((v) => {
      if (v.size !== s || v.stock <= 0) return false;
      if (!selectedColor) return true;
      return (
        v.colorId === selectedColor.id ||
        (!v.colorId && v.colorHex.toUpperCase() === selectedColor.colorHex.toUpperCase())
      );
    });

  const addToCart = () => {
    if (!selectedVariant) return;
    add({
      variantId: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: galleryImages[0] ?? product.fallbackImage,
      color: selectedVariant.colorHex,
      size: selectedVariant.size,
      price: product.price,
    });
    trackAddToCart(
      productItem({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        variant: variantLabel(selectedVariant.size, selectedColor?.name ?? selectedVariant.color),
      })
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const toggleWishlist = async () => {
    if (wishBusy) return;
    setWishBusy(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) {
        const json = await res.json();
        const wishItem = productItem({
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
        });
        if (json.added) trackAddToWishlist(wishItem);
        else trackRemoveFromWishlist(wishItem);
        setWishState(json.added ? "saved" : "idle");
      }
    } finally {
      setWishBusy(false);
    }
  };

  return (
    <div className="mt-8 grid gap-12 lg:grid-cols-2">
      <Gallery images={galleryImages} alt={product.name} />

      <div>
        <div className="flex items-center gap-3">
          {product.isSale ? (
            <Tag label="Розпродаж" style="dark" />
          ) : product.isFeatured ? (
            <Tag label="Новинка" style="cobalt" />
          ) : (
            product.tag && <Tag label={product.tag} style={product.tagStyle} />
          )}
        </div>
        <h1 className="mt-4 font-display text-3xl font-black md:text-[40px]">{product.name}</h1>
        <ProductPrice
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size="lg"
          className="mt-3"
        />

        <div className="mt-8 space-y-8">
          {colors.length > 0 && (
            <div>
              <p className="text-sm font-semibold">Колір</p>
              <div className="mt-3 flex gap-3">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColorId(c.id)}
                    aria-label={`Колір ${c.colorHex}`}
                    className={`h-9 w-9 rounded-full border border-black/10 transition ${
                      c.id === selectedColor?.id
                        ? "ring-2 ring-cobalt ring-offset-2"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.colorHex }}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Оберіть розмір (ріст)</p>
              <button
                type="button"
                onClick={() => setSizeChartOpen(true)}
                className="text-[13px] font-semibold text-cobalt underline underline-offset-2"
              >
                Таблиця розмірів
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {sizesForColor.map((s) => {
                const available = sizeAvailable(s);
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!available}
                    onClick={() => setSize(s)}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                      size === s
                        ? "border-cobalt bg-cobalt/5 font-bold text-cobalt"
                        : available
                          ? "border-[#E0E0E0] bg-white hover:border-obsidian"
                          : "cursor-not-allowed border-[#EEE] text-obsidian/30 line-through"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={addToCart}
              disabled={!selectedVariant}
              className="btn-primary w-full py-[18px] text-[15px]"
            >
              {added
                ? "Додано в кошик ✓"
                : size
                  ? `Додати в кошик • ${formatPrice(product.price)}`
                  : "Оберіть розмір"}
            </button>
            <button
              type="button"
              onClick={toggleWishlist}
              disabled={wishBusy}
              className="btn-secondary w-full"
            >
              <HeartIcon className="h-4 w-4" filled={wishState === "saved"} />
              {wishState === "saved" ? "В обраному" : "В обране"}
            </button>
          </div>
        </div>

        {product.materials && (
          <div className="mt-10 border-t border-black/10 pt-6">
            <h3 className="text-base font-bold">Про матеріали</h3>
            <p className="mt-2 text-sm leading-relaxed text-obsidian/70">{product.materials}</p>
          </div>
        )}

        <div className="mt-6 border-t border-black/10 pt-6">
          <h3 className="text-base font-bold">Опис</h3>
          <p className="mt-2 text-sm leading-relaxed text-obsidian/70">{product.description}</p>
        </div>
      </div>

      <SizeChartModal
        open={sizeChartOpen}
        onClose={() => setSizeChartOpen(false)}
        availableSizes={sizesForColor}
      />
    </div>
  );
}
