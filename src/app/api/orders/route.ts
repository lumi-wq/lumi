import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/format";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().min(1),
  warehouse: z.string().min(1),
  paymentMethod: z.enum(["card", "cod"]),
  promoCode: z.string().optional(),
  items: z
    .array(z.object({ variantId: z.string(), quantity: z.number().int().min(1) }))
    .min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані замовлення" }, { status: 400 });
  }
  const data = parsed.data;
  const user = await getSessionUser();

  // Ціни та наявність перевіряємо на сервері
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: data.items.map((i) => i.variantId) } },
    include: { product: true },
  });
  if (variants.length !== data.items.length) {
    return NextResponse.json({ error: "Деякі товари недоступні" }, { status: 409 });
  }

  const lines = data.items.map((item) => {
    const variant = variants.find((v) => v.id === item.variantId)!;
    return { item, variant };
  });

  const subtotal = lines.reduce(
    (sum, { item, variant }) => sum + variant.product.price * item.quantity,
    0
  );

  let discount = 0;
  let appliedPromo: string | null = null;
  if (data.promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: data.promoCode.toUpperCase() },
    });
    if (promo?.active) {
      discount = Math.round((subtotal * promo.discountPercent) / 100);
      appliedPromo = promo.code;
    }
  }
  // Персональна знижка LUMI CLUB, якщо більша за промокод
  if (user && user.discountPercent > 0) {
    const clubDiscount = Math.round((subtotal * user.discountPercent) / 100);
    if (clubDiscount > discount) {
      discount = clubDiscount;
      appliedPromo = "LUMI CLUB";
    }
  }

  const afterDiscount = subtotal - discount;
  const shipping = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = afterDiscount + shipping;

  const number = `LUMI-${Math.floor(10000 + Math.random() * 90000)}`;

  const order = await prisma.order.create({
    data: {
      number,
      userId: user?.id,
      email: data.email || user?.email || null,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      city: data.city,
      warehouse: data.warehouse,
      paymentMethod: data.paymentMethod,
      subtotal,
      discount,
      shipping,
      total,
      promoCode: appliedPromo,
      items: {
        create: lines.map(({ item, variant }) => ({
          productId: variant.productId,
          name: variant.product.name,
          size: variant.size,
          color: variant.color,
          image: variant.product.images[0] ?? "",
          price: variant.product.price,
          quantity: item.quantity,
        })),
      },
    },
  });

  // Зменшуємо залишки
  for (const { item, variant } of lines) {
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: { decrement: Math.min(item.quantity, variant.stock) } },
    });
  }

  // Чистимо серверний кошик користувача
  if (user) {
    await prisma.cartItem.deleteMany({ where: { userId: user.id } });
  }

  return NextResponse.json({ orderId: order.id, number: order.number, total: order.total });
}
