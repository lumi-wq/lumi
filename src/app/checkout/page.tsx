"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart, cartTotals } from "@/store/cart";
import { formatPrice } from "@/lib/format";

type City = { ref: string; name: string };
type Warehouse = { ref: string; description: string };

export default function CheckoutPage() {
  const router = useRouter();
  const { items, promo, clear } = useCart();
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
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
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

  if (!mounted) return <div className="container-content py-20" />;

  if (items.length === 0) {
    return (
      <div className="container-content py-24 text-center">
        <h1 className="font-display text-3xl font-black">Кошик порожній</h1>
        <Link href="/category/teens" className="btn-primary mt-8">
          До каталогу
        </Link>
      </div>
    );
  }

  const totals = cartTotals(items, promo);
  const canSubmit =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone.length === 9 &&
    city &&
    warehouse;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: `+380${form.phone}`,
          city: city!.name,
          warehouse: warehouse!.description,
          paymentMethod,
          promoCode: promo?.code,
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.qty })),
        }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error ?? "Не вдалося створити замовлення");

      if (paymentMethod === "card") {
        const payRes = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.orderId }),
        });
        const payment = await payRes.json();
        if (!payRes.ok) throw new Error(payment.error ?? "Помилка оплати");
        clear();
        window.location.href = payment.redirectUrl;
      } else {
        clear();
        router.push(`/checkout/success?order=${order.number}`);
      }
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
          </section>

          <section className="rounded-card bg-white p-6 md:p-8">
            <h2 className="font-display text-lg font-bold">3. Оплата</h2>
            <div className="mt-5 space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-4 rounded-input border-[1.5px] px-5 py-4 transition ${
                  paymentMethod === "card"
                    ? "border-cobalt bg-cobalt/5"
                    : "border-[#E0E0E0] hover:border-obsidian"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  className="mt-1 accent-cobalt"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">Карткою онлайн</span>
                  <span className="mt-1 block text-xs leading-relaxed text-obsidian/60">
                    Visa / Mastercard (Monobank, ПриватБанк та інші банки), Apple Pay і Google Pay
                  </span>
                  <span className="mt-3 flex flex-wrap gap-1.5">
                    {["Visa", "Mastercard", "Apple Pay", "Google Pay"].map((label) => (
                      <span
                        key={label}
                        className="rounded-md border border-black/10 bg-white px-2 py-0.5 text-[11px] font-semibold text-obsidian/70"
                      >
                        {label}
                      </span>
                    ))}
                  </span>
                </span>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-4 rounded-input border-[1.5px] px-5 py-4 transition ${
                  paymentMethod === "cod"
                    ? "border-cobalt bg-cobalt/5"
                    : "border-[#E0E0E0] hover:border-obsidian"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="mt-1 accent-cobalt"
                />
                <span>
                  <span className="block text-sm font-bold">Післяплата (Нова Пошта)</span>
                  <span className="mt-1 block text-xs text-obsidian/60">
                    Оплата при отриманні посилки у відділенні або поштоматі
                  </span>
                </span>
              </label>
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
            {totals.discount > 0 && (
              <div className="flex justify-between text-cobalt">
                <dt>Знижка ({promo?.code})</dt>
                <dd className="font-semibold">−{formatPrice(totals.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-obsidian/70">Доставка</dt>
              <dd className="text-[13px] font-bold uppercase">
                {totals.shipping === 0 ? "Безкоштовно" : formatPrice(totals.shipping)}
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-obsidian/10 pt-5">
            <span className="font-display text-lg font-bold">Разом</span>
            <span className="text-2xl font-bold text-cobalt">{formatPrice(totals.total)}</span>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={!canSubmit || submitting} className="btn-primary mt-6 w-full">
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
