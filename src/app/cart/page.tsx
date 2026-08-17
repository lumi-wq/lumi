"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart, cartTotals, cartCount } from "@/store/cart";
import { formatPrice, formatDate, productCountLabel } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { TrashIcon, MinusIcon, PlusIcon } from "@/components/Icons";
import { ordersEnabled } from "@/lib/orders-enabled";
import { OrdersClosedNotice } from "@/components/shop/OrdersClosedNotice";

type RecentOrder = {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  itemsCount: number;
};

function CartOrdersBlock({ recent }: { recent: RecentOrder[] }) {
  return (
    <div className="mt-10 rounded-card border border-black/5 bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Мої замовлення</h2>
          <p className="mt-1 text-sm text-obsidian/60">
            Статус і ТТН — без реєстрації, за номером і телефоном.
          </p>
        </div>
        <Link href="/orders" className="text-sm font-bold text-cobalt hover:underline">
          Відслідкувати →
        </Link>
      </div>

      {recent.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {recent.map((o) => {
            const status = ORDER_STATUS_LABELS[o.status] ?? ORDER_STATUS_LABELS.NEW;
            return (
              <li key={o.id}>
                <Link
                  href={`/orders/${encodeURIComponent(o.number)}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/5 px-4 py-3 transition hover:border-cobalt/40"
                >
                  <div>
                    <p className="font-bold">#{o.number}</p>
                    <p className="mt-0.5 text-[13px] text-obsidian/60">
                      {formatDate(o.createdAt)} • {productCountLabel(o.itemsCount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="font-bold">{formatPrice(o.total)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-obsidian/55">
          Недавніх замовлень на цьому пристрої немає. Можна знайти будь-яке за номером на сторінці{" "}
          <Link href="/orders" className="font-semibold text-cobalt underline">
            Відслідкувати замовлення
          </Link>
          .
        </p>
      )}
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { items, setQty, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  const [recent, setRecent] = useState<RecentOrder[]>([]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/orders/recent")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.recent) setRecent(json.recent);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mounted) return <div className="container-content py-20" />;

  const totals = cartTotals(items, 0);

  if (items.length === 0) {
    return (
      <div className="container-content py-24">
        <div className="text-center">
          <h1 className="font-display text-3xl font-black">Кошик порожній</h1>
          <p className="mt-3 text-obsidian/60">Додайте щось стильне — ми підібрали для вас найкраще.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/category/new" className="btn-primary">
              До каталогу
            </Link>
            <Link href="/orders" className="btn-secondary">
              Відслідкувати замовлення
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-4 max-w-xl">
          <CartOrdersBlock recent={recent} />
        </div>
      </div>
    );
  }

  return (
    <div className="container-content py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-black md:text-4xl">Кошик ({cartCount(items)})</h1>
        <Link href="/orders" className="text-sm font-bold text-cobalt hover:underline">
          Відслідкувати замовлення →
        </Link>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4 self-start rounded-card bg-white p-6">
          {items.map((line) => (
            <div
              key={line.variantId}
              className="flex flex-wrap items-center gap-4 border-b border-black/5 pb-4 last:border-0 last:pb-0"
            >
              <Link href={`/product/${line.slug}`} className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-xl bg-mint/40">
                {line.image && (
                  <Image src={line.image} alt={line.name} fill sizes="100px" className="object-cover" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${line.slug}`} className="font-bold hover:text-cobalt">
                  {line.name}
                </Link>
                <p className="mt-1 flex items-center gap-2 text-sm text-obsidian/60">
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: line.color }}
                    aria-hidden
                  />
                  {line.size}
                </p>
                <button
                  onClick={() => remove(line.variantId)}
                  className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-cobalt hover:underline"
                >
                  <TrashIcon className="h-3.5 w-3.5" /> Видалити
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#E0E0E0] px-2 py-1.5">
                <button onClick={() => setQty(line.variantId, line.qty - 1)} aria-label="Менше">
                  <MinusIcon className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{line.qty}</span>
                <button onClick={() => setQty(line.variantId, line.qty + 1)} aria-label="Більше">
                  <PlusIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="w-20 text-right font-bold">{formatPrice(line.price * line.qty)}</p>
            </div>
          ))}
        </div>

        <aside className="self-start rounded-[20px] bg-mint p-7">
          <h2 className="font-display text-xl font-bold">Ваше замовлення</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-obsidian/70">Сума товарів</dt>
              <dd className="font-semibold">{formatPrice(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-obsidian/70">Упаковка</dt>
              <dd className="text-[13px] font-bold uppercase">Безкоштовно</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-obsidian/70">Доставка (Нова Пошта)</dt>
              <dd className="text-[13px] font-bold uppercase">На оформленні</dd>
            </div>
          </dl>

          <div className="mt-6 flex items-baseline justify-between border-t border-obsidian/10 pt-5">
            <span className="font-display text-lg font-bold">Разом</span>
            <span className="text-2xl font-bold text-cobalt">{formatPrice(totals.total)}</span>
          </div>

          {ordersEnabled() ? (
            <button onClick={() => router.push("/checkout")} className="btn-primary mt-6 w-full">
              Оформити замовлення
            </button>
          ) : (
            <OrdersClosedNotice className="mt-6" />
          )}
          <Link
            href="/orders"
            className="mt-3 block w-full rounded-input border border-obsidian/15 bg-white py-3 text-center text-sm font-bold text-obsidian transition hover:border-cobalt hover:text-cobalt"
          >
            Відслідкувати замовлення
          </Link>
        </aside>
      </div>

      <CartOrdersBlock recent={recent} />
    </div>
  );
}
