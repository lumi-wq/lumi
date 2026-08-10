import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().int().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  images: z.array(z.string().url()).min(1).optional(),
  tag: z.string().nullable().optional(),
  tagStyle: z.string().optional(),
  materials: z.string().optional(),
  isFeatured: z.boolean().optional(),
  sizes: z.array(z.string().min(1)).optional(),
  colors: z.array(z.object({ color: z.string(), colorHex: z.string() })).optional(),
  stock: z.number().int().min(0).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }
  const { sizes, colors, stock, ...data } = parsed.data;

  const product = await prisma.product.update({ where: { id: params.id }, data });

  // Якщо передано розміри+кольори — перебудовуємо варіанти
  if (sizes && colors) {
    await prisma.productVariant.deleteMany({ where: { productId: params.id } });
    await prisma.productVariant.createMany({
      data: sizes.flatMap((size) =>
        colors.map((c) => ({
          productId: params.id,
          size,
          color: c.color,
          colorHex: c.colorHex,
          stock: stock ?? 10,
        }))
      ),
    });
  }
  return NextResponse.json({ product });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
