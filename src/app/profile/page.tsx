import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, productCountLabel } from "@/lib/format";
import { toCardData } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { SettingsToggles } from "@/components/profile/SettingsToggles";
import { WishlistList } from "@/components/profile/WishlistList";

export const metadata = { title: "Профіль", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";


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
      include: { product: { include: { variants: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
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
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-display text-xl font-bold">Мої замовлення</h2>
                <Link href="/orders" className="text-[13px] font-semibold text-cobalt underline">
                  Знайти за номером
                </Link>
              </div>
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
                  const status = ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS.NEW;
                  const itemsCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${encodeURIComponent(order.number)}`}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-black/5 bg-chalk px-6 py-5 transition hover:border-cobalt/40"
                    >
                      <div>
                        <p className="font-bold">Замовлення #{order.number}</p>
                        <p className="mt-1 text-[13px] text-obsidian/60">
                          Від {formatDate(order.createdAt)} • {productCountLabel(itemsCount)}
                        </p>
                        {order.trackingNumber && (
                          <p className="mt-1 text-[13px] text-obsidian/60">
                            ТТН: {order.trackingNumber}
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
                    </Link>
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
            <div id="wishlist" className="rounded-card border border-black/5 bg-chalk p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Обране</h2>
                <Link
                  href="/wishlist"
                  className="text-[13px] font-semibold text-cobalt underline underline-offset-2"
                >
                  Відкрити все
                </Link>
              </div>
              <div className="mt-5">
                {wishlist.length === 0 ? (
                  <p className="text-sm text-obsidian/60">Тут зʼявляться збережені товари.</p>
                ) : (
                  <WishlistList
                    columns={2}
                    initial={wishlist.map((w) => ({
                      id: w.id,
                      productId: w.productId,
                      product: toCardData(w.product),
                    }))}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
