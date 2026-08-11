import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const imagePath = z
  .string()
  .min(1)
  .refine(
    (v) => v.startsWith("/uploads/") || /^https?:\/\//.test(v),
    "Невірний шлях зображення"
  );

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Невірний HEX кольору");

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().int().min(1).optional(),
  compareAtPrice: z.number().int().min(1).nullable().optional(),
  categoryId: z.string().min(1).optional(),
  images: z.array(imagePath).min(1).optional(),
  tag: z.string().nullable().optional(),
  tagStyle: z.string().optional(),
  materials: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isSale: z.boolean().optional(),
  gender: z.enum(["BOY", "GIRL"]).optional(),
  productTypeId: z.string().min(1).nullable().optional(),
  sizes: z.array(z.string().min(1)).optional(),
  colors: z.array(z.object({ color: z.string().min(1), colorHex: hexColor })).optional(),
  stock: z.number().int().min(0).optional(),
}).superRefine((data, ctx) => {
  if (
    data.compareAtPrice != null &&
    data.price != null &&
    data.compareAtPrice <= data.price
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["compareAtPrice"],
      message: "Стара ціна має бути вищою за поточну",
    });
  }
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }
  const { sizes, colors, stock, ...data } = parsed.data;

  if (data.productTypeId || data.gender) {
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      select: { gender: true, productTypeId: true },
    });
    const gender = data.gender ?? existing?.gender;
    const productTypeId = data.productTypeId ?? existing?.productTypeId;
    if (productTypeId) {
      const productType = await prisma.productType.findUnique({ where: { id: productTypeId } });
      if (productType?.girlOnly && gender !== "GIRL") {
        return NextResponse.json(
          { error: `«${productType.name}» доступні лише для дівчаток` },
          { status: 400 }
        );
      }
    }
  }

  const product = await prisma.product.update({ where: { id: params.id }, data });

  // Якщо передано розміри+кольори — перебудовуємо варіанти
  if (sizes && colors) {
    await prisma.productVariant.deleteMany({ where: { productId: params.id } });
    await prisma.productVariant.createMany({
      data: sizes.flatMap((size) =>
        colors.map((c) => {
          const hex = c.colorHex.toUpperCase();
          return {
            productId: params.id,
            size,
            color: hex,
            colorHex: hex,
            stock: stock ?? 10,
          };
        })
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
