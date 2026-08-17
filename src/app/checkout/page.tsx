"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart, cartTotals } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { ordersEnabled } from "@/lib/orders-enabled";
import { OrdersClosedNotice } from "@/components/shop/OrdersClosedNotice";

type City = { ref: string; name: string; cityRef: string };
type Warehouse = { ref: string; description: string };
type ShippingQuote = {
  shipping: number;
  npCost: number;
  weightKg: number;
  dispatchDate: string;
  deliveryDate: string | null;
  deliveryDateLabel: string | null;
};
export default function CheckoutPage() {
  const { items, clear } = useCart();
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [cityQuery, setCityQuery] = useState("");
  const [city, setCity] = useState<City | null>(null);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCityList, setShowCityList] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(cityQuery), 300);
    return () => clearTimeout(debounceRef.current);
  }, [cityQuery]);

  const { data: cities, isFetching: citiesLoading } = useQuery<City[]>({
    queryKey: ["np-cities", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/novaposhta?action=cities&q=${encodeURIComponent(debouncedQuery)}`);
      const json = await res.json();
      return json.cities ?? [];
    },
    enabled: debouncedQuery.trim().length >= 2 && !city,
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["np-warehouses", city?.ref],
    queryFn: async () => {
      const res = await fetch(`/api/novaposhta?action=warehouses&city=${encodeURIComponent(city!.ref)}`);
      const json = await res.json();
      return json.warehouses ?? [];
    },
    enabled: !!city,
  });

  const shippingItems = items.map((i) => ({ variantId: i.variantId, quantity: i.qty }));

  const {
    data: quote,
    isFetching: quoteLoading,
    isError: quoteError,
  } = useQuery<ShippingQuote>({
    queryKey: [
      "np-shipping",
      city?.cityRef,
      warehouse?.ref,
      items.map((i) => `${i.variantId}:${i.qty}`).join("|"),
    ],
    queryFn: async () => {
      const res = await fetch("/api/novaposhta/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityRef: city!.cityRef,
          items: shippingItems,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Не вдалося розрахувати доставку");
      return json.quote as ShippingQuote;
    },
    enabled: Boolean(city?.cityRef && warehouse?.ref && items.length > 0),
    staleTime: 60_000,
  });

  if (!mounted) return <div className="container-content py-20" />;

  if (!ordersEnabled()) {
    return (
      <div className="container-content max-w-xl py-24">
        <h1 className="font-display text-3xl font-black md:text-4xl">Оформлення замовлення</h1>
        <OrdersClosedNotice className="mt-8" />
        <Link href="/category/sale" className="btn-secondary mt-8">
          До каталогу
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-content py-24 text-center">
        <h1 className="font-display text-3xl font-black">Кошик порожній</h1>
        <Link href="/category/new" className="btn-primary mt-8">
          До каталогу
        </Link>
      </div>
    );
  }

  const shippingFee = quote?.shipping ?? 0;
  const totals = cartTotals(items, warehouse && quote ? shippingFee : 0);
  const canSubmit =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone.length === 9 &&
    city &&
    warehouse &&
    quote &&
    !quoteLoading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !city || !warehouse) return;
    setSubmitting(true);
    setError("");
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: `+380${form.phone}`,
          city: city.name,
          cityRef: city.cityRef,
          warehouse: warehouse.description,
          paymentMethod: "card",
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.qty })),
        }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error ?? "Не вдалося створити замовлення");

      const payRes = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId }),
      });
      const payment = await payRes.json();
      if (!payRes.ok) throw new Error(payment.error ?? "Помилка оплати");
      clear();
      window.location.href = payment.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
      setSubmitting(false);
    }
  };

  return (
    <div className="container-content py-14">
      <h1 className="font-display text-3xl font-black md:text-4xl">Оформлення замовлення</h1>

      <form onSubmit={submit} className="mt-10 grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-8">
          <section className="rounded-card bg-white p-6 md:p-8">
            <h2 className="font-display text-lg font-bold">1. Контактні дані</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Ім'я"
                className="input-base"
              />
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Прізвище"
                className="input-base"
              />
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[15px] font-medium text-obsidian">
                  +380
                </span>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 9) })
                  }
                  placeholder="67 123 45 67"
                  className="input-base pl-[68px]"
                  aria-label="Номер телефону без коду країни"
                />
              </div>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email (необов'язково)"
                className="input-base"
              />
            </div>
          </section>

          <section className="rounded-card bg-white p-6 md:p-8">
            <h2 className="font-display text-lg font-bold">2. Доставка — Нова Пошта</h2>
            <div className="relative mt-5">
              <input
                value={city ? city.name : cityQuery}
                onChange={(e) => {
                  setCity(null);
                  setWarehouse(null);
                  setCityQuery(e.target.value);
                  setShowCityList(true);
                }}
                placeholder="Почніть вводити місто..."
                className="input-base"
              />
              {showCityList && !city && debouncedQuery.trim().length >= 2 && (
                <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-input border border-black/10 bg-white shadow-lg">
                  {cities?.map((c) => (
                    <li key={c.ref}>
                      <button
                        type="button"
                        onClick={() => {
                          setCity(c);
                          setShowCityList(false);
                        }}
                        className="w-full px-5 py-3 text-left text-sm hover:bg-chalk"
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                  {citiesLoading && (
                    <li className="px-5 py-3 text-sm text-obsidian/50">Шукаємо...</li>
                  )}
                  {!citiesLoading && (cities?.length ?? 0) === 0 && (
                    <li className="px-5 py-3 text-sm text-obsidian/50">
                      Місто не знайдено — спробуйте інший запит
                    </li>
                  )}
                </ul>
              )}
            </div>
            {!city && cityQuery.trim().length > 0 && cityQuery.trim().length < 2 && (
              <p className="mt-2 text-xs text-obsidian/50">Введіть щонайменше 2 літери</p>
            )}
            {city && (
              <select
                required
                value={warehouse?.ref ?? ""}
                onChange={(e) =>
                  setWarehouse(warehouses?.find((w) => w.ref === e.target.value) ?? null)
                }
                className="input-base mt-4 cursor-pointer"
              >
                <option value="" disabled>
                  Оберіть відділення...
                </option>
                {warehouses?.map((w) => (
                  <option key={w.ref} value={w.ref}>
                    {w.description}
                  </option>
                ))}
              </select>
            )}
            {warehouse && (
              <div className="mt-4 rounded-xl bg-chalk/80 px-4 py-3 text-sm text-obsidian/80">
                {quoteLoading && <p>Рахуємо доставку...</p>}
                {quoteError && (
                  <p className="text-red-600">Не вдалося розрахувати доставку. Спробуйте ще раз.</p>
                )}
                {quote && !quoteLoading && (
                  <p>
                    Орієнтовна доставка:{" "}
                    <span className="font-semibold text-obsidian">
                      {quote.deliveryDateLabel ?? quote.deliveryDate ?? "уточнюється"}
                    </span>
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-card bg-white p-6 md:p-8">
            <h2 className="font-display text-lg font-bold">3. Оплата</h2>
            <div className="mt-5 rounded-input border-[1.5px] border-cobalt bg-cobalt/5 px-5 py-4">
              <p className="text-sm font-bold">Карткою онлайн (plata by mono)</p>
              <p className="mt-1 text-xs leading-relaxed text-obsidian/60">
                Visa / Mastercard будь-якого банку, Apple Pay і Google Pay через Monobank
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Visa", "Mastercard", "Apple Pay", "Google Pay"].map((label) => (
                  <span
                    key={label}
                    className="rounded-md border border-black/10 bg-white px-2 py-0.5 text-[11px] font-semibold text-obsidian/70"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="self-start rounded-[20px] bg-mint p-7">
          <h2 className="font-display text-xl font-bold">Ваше замовлення</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {items.map((line) => (
              <li key={line.variantId} className="flex justify-between gap-3">
                <span className="text-obsidian/80">
                  {line.name} <span className="text-obsidian/50">×{line.qty}</span>
                </span>
                <span className="shrink-0 font-semibold">{formatPrice(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2.5 border-t border-obsidian/10 pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-obsidian/70">Сума товарів</dt>
              <dd className="font-semibold">{formatPrice(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-obsidian/70">Доставка</dt>
              <dd className="text-[13px] font-bold uppercase">
                {!warehouse
                  ? "Оберіть відділення"
                  : quoteLoading
                    ? "..."
                    : totals.shipping === 0
                      ? "Безкоштовно"
                      : formatPrice(totals.shipping)}
              </dd>
            </div>
            {quote?.deliveryDateLabel && (
              <div className="flex justify-between gap-3 text-xs text-obsidian/60">
                <dt>Орієнтовно прибуде</dt>
                <dd className="text-right font-medium text-obsidian">{quote.deliveryDateLabel}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-obsidian/10 pt-5">
            <span className="font-display text-lg font-bold">Разом</span>
            <span className="text-2xl font-bold text-cobalt">
              {warehouse && quote && !quoteLoading ? formatPrice(totals.total) : "—"}
            </span>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="btn-primary mt-6 w-full"
          >
            {submitting ? "Опрацьовуємо..." : "Підтвердити замовлення"}
          </button>
          <p className="mt-3 text-center text-xs text-obsidian/50">
            Реєстрація не потрібна — оформлюйте як гість
          </p>
        </aside>
      </form>
    </div>
  );
}
