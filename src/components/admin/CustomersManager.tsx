"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/format";

type Customer = {
  id: string;
  email: string;
  name: string | null;
  discountPercent: number;
  isAdmin: boolean;
  createdAt: string;
  _count: { orders: number };
};

const DISCOUNTS = [0, 5, 10, 15, 20];

export function CustomersManager() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<{ users: Customer[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => (await fetch("/api/admin/users")).json(),
  });

  const updateDiscount = useMutation({
    mutationFn: async ({ id, discountPercent }: { id: string; discountPercent: number }) => {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountPercent }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div className="mt-6 overflow-x-auto rounded-card bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-black/5 text-xs uppercase text-obsidian/50">
          <tr>
            <th className="px-5 py-3.5">Клієнт</th>
            <th className="px-5 py-3.5">З нами від</th>
            <th className="px-5 py-3.5">Замовлень</th>
            <th className="px-5 py-3.5">Знижка LUMI CLUB</th>
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
          {data?.users.map((user) => (
            <tr key={user.id}>
              <td className="px-5 py-3.5">
                <p className="font-medium">
                  {user.name ?? "—"}
                  {user.isAdmin && (
                    <span className="ml-2 rounded bg-obsidian px-1.5 py-0.5 text-[10px] font-bold text-white">
                      ADMIN
                    </span>
                  )}
                </p>
                <p className="text-obsidian/60">{user.email}</p>
              </td>
              <td className="px-5 py-3.5 text-obsidian/60">{formatDate(user.createdAt)}</td>
              <td className="px-5 py-3.5">{user._count.orders}</td>
              <td className="px-5 py-3.5">
                <select
                  value={user.discountPercent}
                  onChange={(e) =>
                    updateDiscount.mutate({ id: user.id, discountPercent: Number(e.target.value) })
                  }
                  className="cursor-pointer rounded-lg border border-[#E0E0E0] px-3 py-1.5 font-semibold outline-none"
                >
                  {DISCOUNTS.map((d) => (
                    <option key={d} value={d}>
                      {d}%
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
