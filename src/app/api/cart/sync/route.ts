import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const schema = z.object({
  items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().min(1) })),
});

/** Зливає гостьовий кошик (localStorage) із серверним кошиком користувача. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }

  for (const item of parsed.data.items) {
    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (!variant) continue;
    await prisma.cartItem.upsert({
      where: { userId_variantId: { userId: user.id, variantId: item.variantId } },
      update: { quantity: item.quantity },
      create: {
        userId: user.id,
        productId: variant.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      },
    });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true, variant: true },
  });
  return NextResponse.json({
    items: items.map((i) => ({
      variantId: i.variantId,
      productId: i.productId,
      slug: i.product.slug,
      name: i.product.name,
      image: i.product.images[0] ?? "",
      color: i.variant.color,
      size: i.variant.size,
      price: i.product.price,
      qty: i.quantity,
    })),
  });
}
