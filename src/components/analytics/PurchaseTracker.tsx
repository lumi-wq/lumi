"use client";

import { useEffect } from "react";
import { productItem, trackPurchase, variantLabel } from "@/lib/ga";

export type PurchaseItem = {
  productId: string;
  name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
};

export function PurchaseTracker({
  orderNumber,
  total,
  shipping,
  items,
}: {
  orderNumber: string;
  total: number;
  shipping: number;
  items: PurchaseItem[];
}) {
  useEffect(() => {
    const key = `ga_purchase_${orderNumber}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* still send once per mount */
    }
    trackPurchase({
      transactionId: orderNumber,
      value: total,
      shipping,
      items: items.map((item) =>
        productItem({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: variantLabel(item.size, item.color),
        })
      ),
    });
  }, [orderNumber, total, shipping, items]);

  return null;
}
