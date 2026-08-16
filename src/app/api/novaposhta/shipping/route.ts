import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { quoteWarehouseShipping } from "@/lib/novaposhta";
import { cartWeightKg } from "@/lib/shipping-weight";

const schema = z.object({
  cityRef: z.string().min(1),
  items: z
    .array(z.object({ variantId: z.string(), quantity: z.number().int().min(1) }))
    .min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: parsed.data.items.map((i) => i.variantId) } },
    include: { product: { include: { productType: true } } },
  });
  if (variants.length !== parsed.data.items.length) {
    return NextResponse.json({ error: "Деякі товари недоступні" }, { status: 409 });
  }

  const lines = parsed.data.items.map((item) => {
    const variant = variants.find((v) => v.id === item.variantId)!;
    return {
      quantity: item.quantity,
      productTypeSlug: variant.product.productType?.slug ?? null,
      price: variant.product.price,
    };
  });

  const declaredCost = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const weightKg = cartWeightKg(lines);

  const quote = await quoteWarehouseShipping({
    cityRecipientRef: parsed.data.cityRef,
    weightKg,
    declaredCost,
  });

  return NextResponse.json({ quote });
}
