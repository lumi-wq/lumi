import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, productCountLabel } from "@/lib/format";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { SettingsToggles } from "@/components/profile/SettingsToggles";
import { WishlistList } from "@/components/profile/WishlistList";

export const metadata = { title: "Профіль" };
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  NEW: { label: "НОВЕ", className: "bg-chalk text-obsidian/70" },
  PAID: { label: "ОПЛАЧЕНО", className: "bg-mint text-obsidian" },
  PROCESSING: { label: "ЗБИРАЄТЬСЯ", className: "bg-mint text-obsidian" },
  SHIPPED: { label: "ВІДПРАВЛЕНО", className: "bg-cobalt/10 text-cobalt" },
  ARRIVED: { label: "ПРИБУЛА", className: "bg-amber-100 text-amber-800" },
  DELIVERED: { label: "ОТРИМАНО", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "СКАСОВАНО", className: "bg-red-100 text-red-600" },
};

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth");

  const [orders, wishlist] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const memberSince = new Date(user.createdAt).getFullYear();
  const displayName = user.name ?? user.email.split("@")[0];

  return (
    <>
      <section className="bg-chalk">
        <div className="container-content flex flex-wrap items-center justify-between gap-6 py-12">
          <div>
            <h1 className="font-display text-[32px] font-black">Вітаємо, {displayName}!</h1>
            <p className="mt-2 text-sm text-obsidian/60">
              {user.email} • Клієнт LUMI з {memberSince} року
            </p>
          </div>
          <LogoutButton />
        </div>
      </section>

      <section className="border-t border-black/5 bg-white py-12">
        <div className="container-content grid gap-10 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-xl font-bold">Мої замовлення</h2>
              <div className="mt-5 space-y-4">
                {orders.length === 0 && (
                  <div className="rounded-card bg-chalk p-8 text-center text-sm text-obsidian/60">
                    Замовлень поки немає.{" "}
                    <Link href="/category/new" className="font-semibold text-cobalt underline">
                      До каталогу
                    </Link>
                  </div>
                )}
                {orders.map((order) => {
                  const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.NEW;
                  const itemsCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
                  return (
                    <div
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-black/5 bg-chalk px-6 py-5"
                    >
                      <div>
                        <p className="font-bold">Замовлення #{order.number}</p>
                        <p className="mt-1 text-[13px] text-obsidian/60">
                          Від {formatDate(order.createdAt)} • {productCountLabel(itemsCount)}
                        </p>
                        {order.trackingNumber && (
                          <p className="mt-1 text-[13px] text-obsidian/60">
                            ТТН:{" "}
                            <a
                              href={`https://novaposhta.ua/tracking/?cargo_number=${order.trackingNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-cobalt underline underline-offset-2"
                            >
                              {order.trackingNumber}
                            </a>
                            {order.npStatusText ? ` — ${order.npStatusText}` : ""}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-5">
                        <span
                          className={`rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <span className="font-bold">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold">Налаштування профілю</h2>
              <SettingsToggles
                initial={{
                  newsletter: user.newsletter,
                  deliveryNotifications: user.deliveryNotifications,
                }}
              />
            </div>
          </div>

          <div className="space-y-8 self-start">
            <div className="rounded-[20px] bg-cobalt p-8 text-white">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold">LUMI CLUB</span>
                <span className="rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
                  Лояльність
                </span>
              </div>
              <p className="mt-6 font-display text-[56px] font-black leading-none">
                {user.discountPercent}%
              </p>
              <p className="mt-3 text-sm text-white/85">Ваша персональна знижка на всі товари</p>
              <p className="mt-6 border-t border-white/20 pt-5 text-xs leading-relaxed text-white/70">
                Промокод активується автоматично в кошику під час оформлення замовлення.
              </p>
            </div>

            <div id="wishlist" className="rounded-card border border-black/5 bg-chalk p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Обране</h2>
                <Link
                  href="/category/new"
                  className="text-[13px] font-semibold text-cobalt underline underline-offset-2"
                >
                  Дивитись все
                </Link>
              </div>
              <WishlistList
                initial={wishlist.map((w) => ({
                  id: w.id,
                  productId: w.productId,
                  slug: w.product.slug,
                  name: w.product.name,
                  price: w.product.price,
                  image: w.product.images[0] ?? "",
                }))}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
