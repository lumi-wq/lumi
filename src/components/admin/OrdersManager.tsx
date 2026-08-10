"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice, formatDate } from "@/lib/format";

type AdminOrder = {
  id: string;
  number: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  warehouse: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  trackingNumber: string | null;
  npStatusText: string | null;
  total: number;
  promoCode: string | null;
  createdAt: string;
  items: { id: string; name: string; size: string; color: string; quantity: number }[];
  user: { email: string } | null;
};

const STATUSES = [
  { value: "NEW", label: "Нове" },
  { value: "PAID", label: "Оплачено" },
  { value: "PROCESSING", label: "Збирається" },
  { value: "SHIPPED", label: "Відправлено" },
  { value: "ARRIVED", label: "Прибула" },
  { value: "DELIVERED", label: "Отримано" },
  { value: "CANCELLED", label: "Скасовано" },
];

export function OrdersManager() {
  const queryClient = useQueryClient();
  const [ttnDrafts, setTtnDrafts] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<{ orders: AdminOrder[] }>({
    queryKey: ["admin-orders"],
    queryFn: async () => (await fetch("/api/admin/orders")).json(),
  });

  const patch = useMutation({
    mutationFn: async (payload: {
      id: string;
      status?: string;
      trackingNumber?: string | null;
      syncTracking?: boolean;
    }) => {
      const res = await fetch(`/api/admin/orders/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Не вдалося оновити замовлення");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  if (isLoading) return <p className="mt-8 text-obsidian/50">Завантаження...</p>;

  return (
    <div className="mt-6 space-y-4">
      {data?.orders.length === 0 && (
        <p className="rounded-card bg-white p-8 text-center text-obsidian/50">Замовлень немає.</p>
      )}
      {data?.orders.map((order) => {
        const ttnValue = ttnDrafts[order.id] ?? order.trackingNumber ?? "";
        return (
          <div key={order.id} className="rounded-card bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-bold">
                  #{order.number}
                  {order.promoCode && (
                    <span className="ml-2 rounded bg-mint px-1.5 py-0.5 text-[10px] font-bold">
                      {order.promoCode}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[13px] text-obsidian/60">
                  {formatDate(order.createdAt)} • {order.firstName} {order.lastName} • {order.phone}
                  {order.user && ` • ${order.user.email}`}
                </p>
                <p className="mt-1 text-[13px] text-obsidian/60">
                  {order.city}, {order.warehouse}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[12px] uppercase text-obsidian/50">
                  {order.paymentMethod === "card" ? "Картка" : "Післяплата"} /{" "}
                  {order.paymentStatus === "paid" ? "оплачено" : "очікує"}
                </span>
                <select
                  value={order.status}
                  onChange={(e) => patch.mutate({ id: order.id, status: e.target.value })}
                  className="cursor-pointer rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm font-semibold outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className="font-display text-lg font-bold text-cobalt">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-black/5 pt-4">
              <label className="min-w-[220px] flex-1 text-[13px]">
                <span className="mb-1.5 block font-semibold text-obsidian/70">ТТН Нової Пошти</span>
                <input
                  value={ttnValue}
                  onChange={(e) =>
                    setTtnDrafts((prev) => ({ ...prev, [order.id]: e.target.value }))
                  }
                  placeholder="2045xxxxxxxxxxxx"
                  className="input-base py-2.5 font-mono text-sm"
                />
              </label>
              <button
                type="button"
                disabled={patch.isPending}
                onClick={() =>
                  patch.mutate({
                    id: order.id,
                    trackingNumber: ttnValue.trim() || null,
                    syncTracking: Boolean(ttnValue.trim()),
                  })
                }
                className="btn-primary py-2.5 text-[12px]"
              >
                Зберегти ТТН
              </button>
              {order.trackingNumber && (
                <button
                  type="button"
                  disabled={patch.isPending}
                  onClick={() =>
                    patch.mutate({ id: order.id, syncTracking: true })
                  }
                  className="btn-secondary py-2.5 text-[12px]"
                >
                  Оновити статус з НП
                </button>
              )}
              {order.npStatusText && (
                <p className="w-full text-[13px] text-obsidian/60">
                  Статус НП: <span className="font-medium text-obsidian">{order.npStatusText}</span>
                </p>
              )}
            </div>

            <ul className="mt-3 text-[13px] text-obsidian/70">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.name} — {item.color} / {item.size} × {item.quantity}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
