import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { applyGuestCookie, getOrCreateGuestId, normalizePhone } from "@/lib/guest";
import { quoteWarehouseShipping } from "@/lib/novaposhta";
import { cartWeightKg } from "@/lib/shipping-weight";
import { ORDERS_CLOSED_MESSAGE, ordersEnabled } from "@/lib/orders-enabled";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().min(1),
  cityRef: z.string().min(1),
  warehouse: z.string().min(1),
  paymentMethod: z.literal("card"),
  items: z
    .array(z.object({ variantId: z.string(), quantity: z.number().int().min(1) }))
    .min(1),
});

export async function POST(req: Request) {
  if (!ordersEnabled()) {
    return NextResponse.json({ error: ORDERS_CLOSED_MESSAGE }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані замовлення" }, { status: 400 });
  }
  const data = parsed.data;
  const user = await getSessionUser();
  const { guestId, isNew } = getOrCreateGuestId();

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: data.items.map((i) => i.variantId) } },
    include: {
      product: { include: { productType: true } },
      colorRef: { select: { images: true, colorHex: true, name: true } },
    },
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

  const weightKg = cartWeightKg(
    lines.map(({ item, variant }) => ({
      quantity: item.quantity,
      productTypeSlug: variant.product.productType?.slug ?? null,
    }))
  );

  const quote = await quoteWarehouseShipping({
    cityRecipientRef: data.cityRef,
    weightKg,
    declaredCost: subtotal,
  });
  const shipping = quote.shipping;
  const total = subtotal + shipping;

  const number = `LUMI-${Math.floor(10000 + Math.random() * 90000)}`;
  const phone = normalizePhone(data.phone) || data.phone.trim();
  const email = (data.email || user?.email || "").toLowerCase() || null;

  const order = await prisma.order.create({
    data: {
      number,
      userId: user?.id,
      guestId,
      email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone,
      city: data.city,
      warehouse: data.warehouse,
      paymentMethod: data.paymentMethod,
      subtotal,
      discount: 0,
      shipping,
      total,
      promoCode: null,
      items: {
        create: lines.map(({ item, variant }) => ({
          productId: variant.productId,
          name: variant.product.name,
          size: variant.size,
          color: variant.colorHex || variant.colorRef?.colorHex || variant.color,
          image:
            variant.colorRef?.images[0] ??
            variant.product.images[0] ??
            "",
          price: variant.product.price,
          quantity: item.quantity,
        })),
      },
    },
  });

  for (const { item, variant } of lines) {
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: { decrement: Math.min(item.quantity, variant.stock) } },
    });
  }

  if (user) {
    await prisma.cartItem.deleteMany({ where: { userId: user.id } });
  }

  const res = NextResponse.json({
    orderId: order.id,
    number: order.number,
    deliveryDate: quote.deliveryDateLabel,
  });
  if (isNew) applyGuestCookie(res, guestId);
  return res;
}
