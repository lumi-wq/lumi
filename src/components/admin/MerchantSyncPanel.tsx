"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

type MerchantStatus = {
  configured: boolean;
  accountId?: string;
  dataSourceId?: string;
};

type SyncResponse = {
  result?: { inserted: number; deleted: number; failed: number; name: string; items?: { ok: boolean; error?: string }[] };
  error?: string;
};

export function MerchantSyncPanel({ productIds }: { productIds: string[] }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const status = useQuery<MerchantStatus>({
    queryKey: ["admin-merchant"],
    queryFn: async () => (await fetch("/api/admin/merchant")).json(),
  });

  const syncOne = async (productId: string) => {
    const res = await fetch("/api/admin/merchant/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const json = (await res.json().catch(() => ({}))) as SyncResponse;
    if (!res.ok) throw new Error(json.error ?? "Помилка синхронізації");
    return json.result;
  };

  const syncAll = async () => {
    if (productIds.length === 0) {
      setMessage("Немає товарів для надсилання");
      return;
    }
    setBusy(true);
    setMessage("");
    let inserted = 0;
    let failed = 0;
    try {
      for (let i = 0; i < productIds.length; i++) {
        setMessage(`Надсилаємо ${i + 1} з ${productIds.length}…`);
        const result = await syncOne(productIds[i]);
        inserted += result?.inserted ?? 0;
        failed += result?.failed ?? 0;
      }
      setMessage(
        failed > 0
          ? `Надіслано варіантів: ${inserted}. Помилок: ${failed}. Перевірте Merchant Center через кілька хвилин.`
          : `Готово: надіслано ${inserted} варіантів (колір × розмір) у Merchant Center.`
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Помилка синхронізації");
    } finally {
      setBusy(false);
    }
  };

  if (status.isLoading) return null;
  if (!status.data?.configured) {
    return (
      <div className="mb-6 rounded-card bg-white p-5 text-sm text-obsidian/70">
        Google Merchant API ще не підключений на цьому середовищі. Додайте змінні
        GOOGLE_MERCHANT_* та GOOGLE_OAUTH_* у Vercel Production.
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-card bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-base font-bold">Google Merchant Center</p>
          <p className="mt-1 text-sm text-obsidian/60">
            Акаунт {status.data.accountId}, джерело {status.data.dataSourceId}
          </p>
        </div>
        <button type="button" disabled={busy} onClick={() => void syncAll()} className="btn-secondary">
          {busy ? "Надсилаємо…" : "Надіслати товари в Google"}
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-obsidian/80">{message}</p>}
    </div>
  );
}
