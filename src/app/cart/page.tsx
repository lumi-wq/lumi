"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart, cartTotals, cartCount } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { TrashIcon, MinusIcon, PlusIcon } from "@/components/Icons";

export default function CartPage() {
  const router = useRouter();
  const { items, promo, setQty, remove, setPromo } = useCart();
  const [mounted, setMounted] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (promo) setPromoInput(promo.code);
  }, [promo]);

  if (!mounted) return <div className="container-content py-20" />;

  const totals = cartTotals(items, promo);

  const applyPromo = async () => {
    setPromoError("");
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const res = await fetch("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      const json = await res.json();
      setPromo({ code: json.code, percent: json.discountPercent });
    } else {
      setPromo(null);
      setPromoError("Промокод недійсний або неактивний");
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-content py-24 text-center">
        <h1 className="font-display text-3xl font-black">Кошик порожній</h1>
        <p className="mt-3 text-obsidian/60">Додайте щось стильне — ми підібрали для вас найкраще.</p>
        <Link href="/category/new" className="btn-primary mt-8">
          До каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="container-content py-14">
      <h1 className="font-display text-3xl font-black md:text-4xl">Кошик ({cartCount(items)})</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4 self-start rounded-card bg-white p-6">
          {items.map((line) => (
            <div
              key={line.variantId}
              className="flex flex-wrap items-center gap-4 border-b border-black/5 pb-4 last:border-0 last:pb-0"
            >
              <Link href={`/product/${line.slug}`} className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-xl bg-mint/40">
                {line.image && (
                  <Image src={line.image} alt={line.name} fill sizes="100px" className="object-cover" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${line.slug}`} className="font-bold hover:text-cobalt">
                  {line.name}
                </Link>
                <p className="mt-1 flex items-center gap-2 text-sm text-obsidian/60">
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: line.color }}
                    aria-hidden
                  />
                  {line.size}
                </p>
                <button
                  onClick={() => remove(line.variantId)}
                  className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-cobalt hover:underline"
                >
                  <TrashIcon className="h-3.5 w-3.5" /> Видалити
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#E0E0E0] px-2 py-1.5">
                <button onClick={() => setQty(line.variantId, line.qty - 1)} aria-label="Менше">
                  <MinusIcon className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{line.qty}</span>
                <button onClick={() => setQty(line.variantId, line.qty + 1)} aria-label="Більше">
                  <PlusIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="w-20 text-right font-bold">{formatPrice(line.price * line.qty)}</p>
            </div>
          ))}
        </div>

        <aside className="self-start rounded-[20px] bg-mint p-7">
          <h2 className="font-display text-xl font-bold">Ваше замовлення</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-obsidian/70">Сума товарів</dt>
              <dd className="font-semibold">{formatPrice(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-obsidian/70">Упаковка</dt>
              <dd className="text-[13px] font-bold uppercase">Безкоштовно</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-obsidian/70">Доставка (Нова Пошта)</dt>
              <dd className="text-[13px] font-bold uppercase">
                {totals.shipping === 0 ? "Безкоштовно" : formatPrice(totals.shipping)}
              </dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-cobalt">
                <dt>Знижка ({promo?.percent}%)</dt>
                <dd className="font-semibold">−{formatPrice(totals.discount)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 border-t border-obsidian/10 pt-5">
            <p className="text-sm font-semibold">Промокод</p>
            <div className="mt-2.5 flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="LUMILIGHT"
                className="input-base flex-1 bg-white py-3"
              />
              <button
                onClick={applyPromo}
                className={`shrink-0 rounded-input px-4 text-[12px] font-bold uppercase text-white transition ${
                  promo ? "bg-obsidian" : "bg-cobalt hover:bg-[#2E00CC]"
                }`}
              >
                {promo ? "Застосовано" : "Застосувати"}
              </button>
            </div>
            {promoError && <p className="mt-2 text-xs text-red-600">{promoError}</p>}
          </div>

          <div className="mt-6 flex items-baseline justify-between border-t border-obsidian/10 pt-5">
            <span className="font-display text-lg font-bold">Разом</span>
            <span className="text-2xl font-bold text-cobalt">{formatPrice(totals.total)}</span>
          </div>

          <button onClick={() => router.push("/checkout")} className="btn-primary mt-6 w-full">
            Оформити замовлення
          </button>
        </aside>
      </div>
    </div>
  );
}
