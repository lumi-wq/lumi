"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderTrackForm({ initialNumber = "" }: { initialNumber?: string }) {
  const router = useRouter();
  const [number, setNumber] = useState(initialNumber);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (phone.length !== 9) {
      setError("Введіть 9 цифр номера після +380");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: number.trim(), phone: `+380${phone}` }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Не знайдено");
      router.push(`/orders/${encodeURIComponent(json.number)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-card bg-white p-6 md:p-8">
      <h2 className="font-display text-xl font-bold">Знайти замовлення</h2>
      <p className="mt-2 text-sm text-obsidian/60">
        Введіть номер замовлення та телефон, який вказували при оформленні.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Номер замовлення</span>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="LUMI-12345"
            className="mt-1.5 w-full rounded-input border border-[#E0E0E0] px-4 py-3 outline-none focus:border-cobalt"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Телефон</span>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium text-obsidian">
              +380
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              placeholder="67 123 45 67"
              className="w-full rounded-input border border-[#E0E0E0] py-3 pl-[68px] pr-4 outline-none focus:border-cobalt"
              aria-label="Номер телефону без коду країни"
              required
            />
          </div>
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary mt-6">
        {loading ? "Шукаємо..." : "Показати статус"}
      </button>
    </form>
  );
}
