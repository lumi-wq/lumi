import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      slug: i.product.slug,
      name: i.product.name,
      price: i.product.price,
      image: i.product.images[0] ?? "",
    })),
  });
}

const schema = z.object({ productId: z.string() });

/** Перемикає товар в обраному. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId: parsed.data.productId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ added: false });
  }
  await prisma.wishlistItem.create({
    data: { userId: user.id, productId: parsed.data.productId },
  });
  return NextResponse.json({ added: true });
}
