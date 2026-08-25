"use client";

import { useEffect, useState } from "react";
import { PurchaseTracker, type PurchaseItem } from "@/components/analytics/PurchaseTracker";

export function PaymentStatusSync({
  orderNumber,
  initialStatus,
  total,
  shipping,
  items,
}: {
  orderNumber: string;
  initialStatus: string;
  total: number;
  shipping: number;
  items: PurchaseItem[];
}) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status === "paid" || status === "failed" || status === "expired") return;

    let attempts = 0;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(`/api/payment/status?order=${encodeURIComponent(orderNumber)}`);
        const json = (await res.json()) as { paymentStatus?: string };
        if (!cancelled && json.paymentStatus) setStatus(json.paymentStatus);
      } catch {
        /* наступна спроба */
      }
    };

    void tick();
    const id = setInterval(() => {
      attempts += 1;
      void tick();
      if (attempts >= 30) clearInterval(id);
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [orderNumber, status]);

  const message =
    status === "paid"
      ? " Оплату отримано."
      : status === "failed"
        ? " Оплату не завершено. Якщо кошти не списались — спробуйте ще раз."
        : status === "expired"
          ? " Час на оплату минув."
          : " Очікуємо підтвердження оплати карткою.";

  return (
    <>
      {message}
      {status === "paid" && (
        <PurchaseTracker
          orderNumber={orderNumber}
          total={total}
          shipping={shipping}
          items={items}
        />
      )}
    </>
  );
}
