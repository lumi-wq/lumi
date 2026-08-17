import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { ORDERS_CLOSED_MESSAGE, ordersEnabled } from "@/lib/orders-enabled";

const schema = z.object({ orderId: z.string() });

export async function POST(req: Request) {
  if (!ordersEnabled()) {
    return NextResponse.json({ error: ORDERS_CLOSED_MESSAGE }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірний запит" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 });

  const provider = getPaymentProvider();
  try {
    const result = await provider.createPayment({
      id: order.id,
      number: order.number,
      total: order.total,
      description: `Замовлення ${order.number} — LUMI`,
    });
    // Мок-провайдер одразу позначає замовлення оплаченим
    if (provider.name === "mock") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "paid", status: "PAID" },
      });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Помилка платіжного провайдера";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
