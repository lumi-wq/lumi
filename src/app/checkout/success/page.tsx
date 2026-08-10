import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { CheckIcon } from "@/components/Icons";

export const metadata = { title: "Замовлення оформлено" };
export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const order = searchParams.order
    ? await prisma.order.findUnique({
        where: { number: searchParams.order },
        include: { items: true },
      })
    : null;

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
              {order.paymentStatus === "paid"
                ? " Оплату отримано."
                : " Оплата при отриманні на Новій Пошті."}
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
              Ми надіслали деталі на {order.email ?? "ваш телефон"}. Статус можна відстежувати у
              профілі.
            </p>
          </>
        ) : (
          <p className="mt-3 text-obsidian/70">Замовлення прийнято в обробку.</p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/" className="btn-primary w-full">
            На головну
          </Link>
          <Link href="/profile" className="btn-secondary w-full">
            Мої замовлення
          </Link>
        </div>
      </div>
    </div>
  );
}
