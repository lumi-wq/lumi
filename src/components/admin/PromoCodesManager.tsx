"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Promo = { id: string; code: string; discountPercent: number; active: boolean };

export function PromoCodesManager() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");

  const { data, isLoading } = useQuery<{ promoCodes: Promo[] }>({
    queryKey: ["admin-promocodes"],
    queryFn: async () => (await fetch("/api/admin/promocodes")).json(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-promocodes"] });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/promocodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, discountPercent: Number(percent) }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      setCode("");
      invalidate();
    },
  });

  const toggle = useMutation({
    mutationFn: async (promo: Promo) => {
      await fetch(`/api/admin/promocodes/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !promo.active }),
      });
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/promocodes/${id}`, { method: "DELETE" });
    },
    onSuccess: invalidate,
  });

  return (
    <div className="mt-6 space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) create.mutate();
        }}
        className="flex flex-wrap gap-3 rounded-card bg-white p-6"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="НОВИЙКОД"
          className="input-base flex-1 uppercase"
        />
        <input
          type="number"
          min={1}
          max={90}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          className="input-base w-28"
          aria-label="Відсоток знижки"
        />
        <button type="submit" disabled={create.isPending} className="btn-primary">
          Створити
        </button>
      </form>

      <div className="overflow-hidden rounded-card bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase text-obsidian/50">
            <tr>
              <th className="px-5 py-3.5">Код</th>
              <th className="px-5 py-3.5">Знижка</th>
              <th className="px-5 py-3.5">Статус</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-obsidian/50">
                  Завантаження...
                </td>
              </tr>
            )}
            {data?.promoCodes.map((promo) => (
              <tr key={promo.id}>
                <td className="px-5 py-3.5 font-mono font-bold">{promo.code}</td>
                <td className="px-5 py-3.5">{promo.discountPercent}%</td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => toggle.mutate(promo)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase ${
                      promo.active ? "bg-mint text-obsidian" : "bg-chalk text-obsidian/50"
                    }`}
                  >
                    {promo.active ? "Активний" : "Вимкнений"}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => remove.mutate(promo.id)}
                    className="font-semibold text-red-500 hover:underline"
                  >
                    Видалити
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
