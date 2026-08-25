import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatDate, productCountLabel } from "@/lib/format";
import { ORDER_STATUS_LABELS, paymentStatusLabel } from "@/lib/order-status";

export type OrderDetailData = {
  number: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  city: string;
  warehouse: string;
  trackingNumber: string | null;
  npStatusText: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoCode: string | null;
  createdAt: Date | string;
  items: {
    name: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
    image: string;
  }[];
};

export function OrderDetailView({ order }: { order: OrderDetailData }) {
  const status = ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS.NEW;
  const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/50">
            Замовлення
          </p>
          <h1 className="mt-2 font-display text-3xl font-black md:text-4xl">#{order.number}</h1>
          <p className="mt-2 text-sm text-obsidian/60">
            Від {formatDate(order.createdAt)} • {productCountLabel(itemsCount)}
          </p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-card bg-white p-6 md:p-8">
          <h2 className="font-display text-xl font-bold">Товари</h2>
          <ul className="mt-6 space-y-5">
            {order.items.map((item, idx) => (
              <li
                key={`${item.name}-${item.size}-${idx}`}
                className="flex gap-4 border-b border-black/5 pb-5 last:border-0 last:pb-0"
              >
                <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-mint/40">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="88px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{item.name}</p>
                  <p className="mt-1 text-sm text-obsidian/60">
                    {item.color} · {item.size} · × {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 font-bold">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-6 self-start">
          <div className="rounded-[20px] bg-mint p-7">
            <h2 className="font-display text-xl font-bold">Підсумок</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-obsidian/70">Товари</dt>
                <dd className="font-semibold">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between gap-4 text-cobalt">
                  <dt>Знижка{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
                  <dd className="font-semibold">−{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-obsidian/70">Доставка</dt>
                <dd className="font-semibold">
                  {order.shipping === 0 ? "Безкоштовно" : formatPrice(order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-obsidian/10 pt-3 text-base">
                <dt className="font-display text-lg font-bold">Разом</dt>
                <dd className="text-xl font-bold text-cobalt">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-card border border-black/5 bg-white p-6">
            <h2 className="font-display text-lg font-bold">Доставка та оплата</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-obsidian/60">Отримувач</dt>
                <dd className="text-right font-medium">
                  {order.firstName} {order.lastName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-obsidian/60">Телефон</dt>
                <dd className="font-medium">{order.phone}</dd>
              </div>
              {order.email && (
                <div className="flex justify-between gap-4">
                  <dt className="text-obsidian/60">Email</dt>
                  <dd className="max-w-[60%] break-all text-right font-medium">{order.email}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-obsidian/60">Відділення</dt>
                <dd className="max-w-[65%] text-right font-medium">
                  {order.city}, {order.warehouse}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-obsidian/60">Оплата</dt>
                <dd className="text-right font-medium">
                  {order.paymentMethod === "card" ? "Картка онлайн" : "Післяплата"}
                  {" · "}
                  {paymentStatusLabel(order.paymentStatus)}
                </dd>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between gap-4">
                  <dt className="text-obsidian/60">ТТН</dt>
                  <dd>
                    <a
                      href={`https://novaposhta.ua/tracking/?cargo_number=${order.trackingNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-cobalt underline"
                    >
                      {order.trackingNumber}
                    </a>
                  </dd>
                </div>
              )}
              {order.npStatusText && (
                <div className="flex justify-between gap-4">
                  <dt className="text-obsidian/60">Статус НП</dt>
                  <dd className="max-w-[65%] text-right font-medium">{order.npStatusText}</dd>
                </div>
              )}
            </dl>
          </div>

          <Link href="/orders" className="block text-center text-sm font-bold text-cobalt hover:underline">
            ← Відслідкувати інше замовлення
          </Link>
        </aside>
      </div>
    </div>
  );
}
