import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { CheckIcon } from "@/components/Icons";
import { PaymentStatusSync } from "@/components/checkout/PaymentStatusSync";
import {
  estimatedDeliveryDateIso,
  isGoogleCustomerReviewsEnabled,
} from "@/lib/google-customer-reviews";
import { syncOrderPaymentFromMonobank } from "@/lib/payments";
import { cartIsTestPaymentOnly } from "@/lib/test-payment";

export const metadata = { title: "Замовлення оформлено" };
export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const loaded = searchParams.order
    ? await prisma.order.findUnique({
        where: { number: searchParams.order },
        include: { items: true, user: { select: { email: true } } },
      })
    : null;

  if (loaded) {
    const paymentStatus = await syncOrderPaymentFromMonobank(loaded);
    if (paymentStatus !== loaded.paymentStatus) {
      loaded.paymentStatus = paymentStatus;
    }
  }

  const order = loaded;
  const trackHref = order ? `/orders/${encodeURIComponent(order.number)}` : "/orders";
  const email = (order?.email || order?.user?.email || "").trim();
  let reviews: { email: string; estimatedDeliveryDate: string } | null = null;
  if (order && email && isGoogleCustomerReviewsEnabled()) {
    const products = await prisma.product.findMany({
      where: { id: { in: order.items.map((item) => item.productId) } },
      select: { slug: true },
    });
    if (!cartIsTestPaymentOnly(products.map((p) => p.slug))) {
      reviews = {
        email,
        estimatedDeliveryDate: estimatedDeliveryDateIso(order.createdAt),
      };
    }
  }

  return (
    <div className="container-content flex justify-center py-24">
      <div className="w-full max-w-lg rounded-card bg-white p-10 text-center shadow-sm">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-cobalt">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-black">Дякуємо за замовлення!</h1>
        {order ? (
          <>
            <p className="mt-3 text-obsidian/70">
              Замовлення <b className="text-obsidian">#{order.number}</b> прийнято.
              <span>
                <PaymentStatusSync
                  orderNumber={order.number}
                  initialStatus={order.paymentStatus}
                  total={order.total}
                  shipping={order.shipping}
                  items={order.items}
                  reviews={reviews}
                />
              </span>
            </p>
            <div className="mt-6 rounded-xl bg-chalk p-5 text-left text-sm">
              <p className="flex justify-between">
                <span className="text-obsidian/60">Доставка</span>
                <span className="max-w-[60%] text-right font-medium">
                  {order.city}, {order.warehouse}
                </span>
              </p>
              <p className="mt-2 flex justify-between">
                <span className="text-obsidian/60">Разом</span>
                <span className="font-bold text-cobalt">{formatPrice(order.total)}</span>
              </p>
            </div>
            <p className="mt-4 text-xs text-obsidian/50">
              Збережіть номер замовлення. Статус можна перевірити за номером і телефоном — без
              реєстрації. Після входу в профіль історія з цього пристрою та email підтягнеться
              автоматично.
            </p>
          </>
        ) : (
          <p className="mt-3 text-obsidian/70">Замовлення прийнято в обробку.</p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <Link href={trackHref} className="btn-primary w-full">
            Відслідкувати замовлення
          </Link>
          <Link href="/auth" className="btn-secondary w-full">
            Створити профіль
          </Link>
          <Link href="/" className="text-sm font-semibold text-cobalt underline-offset-2 hover:underline">
            На головну
          </Link>
        </div>
      </div>
    </div>
  );
}
