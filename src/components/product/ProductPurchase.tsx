"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { HeartIcon } from "@/components/Icons";

type Variant = { id: string; size: string; color: string; colorHex: string; stock: number };

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string;
  };
  variants: Variant[];
};

export function ProductPurchase({ product, variants }: Props) {
  const router = useRouter();
  const add = useCart((s) => s.add);

  const colors = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of variants) {
      const hex = v.colorHex.toUpperCase();
      if (!map.has(hex)) map.set(hex, hex);
    }
    return Array.from(map, ([colorHex]) => ({ colorHex }));
  }, [variants]);

  const sizes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size))),
    [variants]
  );

  const [colorHex, setColorHex] = useState(colors[0]?.colorHex ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [wishState, setWishState] = useState<"idle" | "saved">("idle");

  const selectedVariant = variants.find(
    (v) => v.colorHex.toUpperCase() === colorHex && v.size === size
  );
  const sizeAvailable = (s: string) =>
    variants.some(
      (v) => v.size === s && v.colorHex.toUpperCase() === colorHex && v.stock > 0
    );

  const addToCart = () => {
    if (!selectedVariant) return;
    add({
      variantId: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      color: selectedVariant.colorHex,
      size: selectedVariant.size,
      price: product.price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const toggleWishlist = async () => {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    if (res.status === 401) {
      router.push("/auth");
      return;
    }
    if (res.ok) {
      const json = await res.json();
      setWishState(json.added ? "saved" : "idle");
    }
  };

  return (
    <div className="mt-8 space-y-8">
      <div>
        <p className="text-sm font-semibold">Колір</p>
        <div className="mt-3 flex gap-3">
          {colors.map((c) => (
            <button
              key={c.colorHex}
              onClick={() => {
                setColorHex(c.colorHex);
                setSize(null);
              }}
              aria-label="Обрати колір"
              className={`h-9 w-9 rounded-full border border-black/10 transition ${
                c.colorHex === colorHex ? "ring-2 ring-cobalt ring-offset-2" : "hover:scale-110"
              }`}
              style={{ backgroundColor: c.colorHex }}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Оберіть розмір (вік)</p>
          <button className="text-[13px] font-semibold text-cobalt underline underline-offset-2">
            Таблиця розмірів
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {sizes.map((s) => {
            const available = sizeAvailable(s);
            return (
              <button
                key={s}
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
        <button onClick={toggleWishlist} className="btn-secondary w-full">
          <HeartIcon className="h-4 w-4" filled={wishState === "saved"} />
          {wishState === "saved" ? "В обраному" : "В обране"}
        </button>
      </div>
    </div>
  );
}
