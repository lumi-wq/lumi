import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { phonesMatch } from "@/lib/guest";
import { grantOrderAccess, normalizeOrderNumber } from "@/lib/order-access";

const schema = z.object({
  number: z.string().min(3),
  phone: z.string().min(10),
});

/** Публічний пошук замовлення: номер + телефон (без логіну). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Вкажіть номер замовлення та телефон" }, { status: 400 });
  }

  const number = normalizeOrderNumber(parsed.data.number);

  const order = await prisma.order.findUnique({
    where: { number },
    include: { items: true },
  });

  if (!order || !phonesMatch(order.phone, parsed.data.phone)) {
    return NextResponse.json(
      { error: "Замовлення не знайдено. Перевірте номер і телефон." },
      { status: 404 }
    );
  }

  const res = NextResponse.json({
    number: order.number,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    total: order.total,
    city: order.city,
    warehouse: order.warehouse,
    trackingNumber: order.trackingNumber,
    npStatusText: order.npStatusText,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      name: i.name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      price: i.price,
      image: i.image,
    })),
  });
  grantOrderAccess(res, order.number);
  return res;
}
