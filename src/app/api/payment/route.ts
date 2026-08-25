import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { notifyOrderPaid } from "@/lib/order-sms";
import { ORDERS_CLOSED_MESSAGE, ordersEnabled } from "@/lib/orders-enabled";
import { getSiteUrl } from "@/lib/site";
import { getSessionUser } from "@/lib/auth";
import { isTestPaymentSlug } from "@/lib/test-payment";

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

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 });

  const orderedProducts = await prisma.product.findMany({
    where: { id: { in: order.items.map((item) => item.productId) } },
    select: { slug: true },
  });
  if (orderedProducts.some((p) => isTestPaymentSlug(p.slug))) {
    const user = await getSessionUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 });
    }
  }

  if (order.paymentStatus === "paid") {
    return NextResponse.json({
      redirectUrl: `${getSiteUrl()}/checkout/success?order=${encodeURIComponent(order.number)}`,
      provider: "already-paid",
    });
  }

  const provider = getPaymentProvider();
  try {
    const result = await provider.createPayment({
      id: order.id,
      number: order.number,
      total: order.total,
      description: `Замовлення ${order.number} — LUMI`,
      items: order.items.map((item) => ({
        name: [item.name, item.size].filter(Boolean).join(", "),
        qty: item.quantity,
        unitPrice: item.price,
        code: item.productId,
      })),
      shipping: order.shipping,
      customerEmail: order.email,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        invoiceId: result.invoiceId ?? undefined,
        ...(provider.name === "mock"
          ? { paymentStatus: "paid", status: "PAID" as const }
          : {}),
      },
    });

    if (provider.name === "mock") {
      void notifyOrderPaid({ number: order.number, phone: order.phone, total: order.total });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Помилка платіжного провайдера";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
