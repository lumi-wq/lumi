"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SHIPPING_FEE } from "@/lib/format";

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  color: string;
  size: string;
  price: number;
  qty: number;
};

type CartState = {
  items: CartLine[];
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (line, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === line.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === line.variantId ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          return { items: [...state.items, { ...line, qty }] };
        }),
      remove: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
      setQty: (variantId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) => (i.variantId === variantId ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "lumi-cart" }
  )
);

/** @param shippingOverride — якщо передано, використовується замість фіксованого тарифу. */
export function cartTotals(items: CartLine[], shippingOverride?: number) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping =
    shippingOverride != null ? shippingOverride : items.length === 0 ? 0 : SHIPPING_FEE;
  return { subtotal, discount: 0, shipping, total: subtotal + shipping };
}

export function cartCount(items: CartLine[]) {
  return items.reduce((sum, i) => sum + i.qty, 0);
}
