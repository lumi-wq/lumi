import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncOrderPaymentFromMonobank } from "@/lib/payments";

/**
 * Запасний канал: клієнт на /checkout/success питає статус,
 * якщо webhook від Mono ще не встиг.
 */
export async function GET(req: Request) {
  const orderNumber = new URL(req.url).searchParams.get("order")?.trim();
  if (!orderNumber) {
    return NextResponse.json({ error: "Немає номера замовлення" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    select: { id: true, invoiceId: true, paymentStatus: true },
  });
  if (!order) return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 });

  const paymentStatus = await syncOrderPaymentFromMonobank(order);
  return NextResponse.json({ paymentStatus });
}
