import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { readGuestId } from "@/lib/guest";
import { hasOrderAccess, normalizeOrderNumber } from "@/lib/order-access";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { OrderTrackForm } from "@/components/orders/OrderTrackForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { number: string } }) {
  return {
    title: `Замовлення ${normalizeOrderNumber(params.number)}`,
    robots: { index: false, follow: false },
  };
}

export default async function OrderDetailPage({ params }: { params: { number: string } }) {
  const number = normalizeOrderNumber(decodeURIComponent(params.number));
  if (!number.startsWith("LUMI-")) notFound();

  const order = await prisma.order.findUnique({
    where: { number },
    include: { items: true },
  });
  if (!order) notFound();

  const user = await getSessionUser();
  const guestId = readGuestId();
  const owned =
    (guestId && order.guestId === guestId) ||
    (user && order.userId === user.id) ||
    hasOrderAccess(order.number);

  if (!owned) {
    return (
      <>
        <section className="bg-white">
          <div className="container-content py-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/50">
              Підтримка
            </p>
            <h1 className="mt-3 font-display text-3xl font-black md:text-[40px]">
              Замовлення #{order.number}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-obsidian/70">
              Щоб відкрити деталі, підтвердіть телефон, який вказували при оформленні.
            </p>
          </div>
        </section>
        <section className="border-t border-black/5 bg-chalk py-12">
          <div className="container-content max-w-2xl">
            <OrderTrackForm initialNumber={order.number} />
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="border-t border-black/5 bg-chalk">
      <div className="container-content py-12 md:py-16">
        <p className="mb-8">
          <Link href="/cart" className="text-sm font-bold text-cobalt hover:underline">
            ← До кошика
          </Link>
        </p>
        <OrderDetailView order={order} />
      </div>
    </div>
  );
}
