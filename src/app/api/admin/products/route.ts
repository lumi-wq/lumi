import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const products = await prisma.product.findMany({
    include: { category: true, productType: true, variants: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

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

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().min(1),
  compareAtPrice: z.number().int().min(1).nullable().optional(),
  categoryId: z.string().min(1),
  images: z.array(imagePath).min(1),
  tag: z.string().nullable().optional(),
  tagStyle: z.string().optional(),
  materials: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isSale: z.boolean().optional(),
  gender: z.enum(["BOY", "GIRL"]),
  productTypeId: z.string().min(1),
  sizes: z.array(z.string().min(1)).min(1),
  colors: z.array(z.object({ color: z.string().min(1), colorHex: hexColor })).min(1),
  stock: z.number().int().min(0).default(10),
}).superRefine((data, ctx) => {
  if (data.compareAtPrice != null && data.compareAtPrice <= data.price) {
    ctx.addIssue({
      code: "custom",
      path: ["compareAtPrice"],
      message: "Стара ціна має бути вищою за поточну",
    });
  }
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані товару" }, { status: 400 });
  }
  const { sizes, colors, stock, ...data } = parsed.data;

  const productType = await prisma.productType.findUnique({ where: { id: data.productTypeId } });
  if (!productType) {
    return NextResponse.json({ error: "Категорію не знайдено" }, { status: 400 });
  }
  if (productType.girlOnly && data.gender !== "GIRL") {
    return NextResponse.json(
      { error: `«${productType.name}» доступні лише для дівчаток` },
      { status: 400 }
    );
  }

  const normalizedColors = colors.map((c) => {
    const hex = c.colorHex.toUpperCase();
    return { color: hex, colorHex: hex };
  });
  const product = await prisma.product.create({
    data: {
      ...data,
      variants: {
        create: sizes.flatMap((size) =>
          normalizedColors.map((c) => ({ size, color: c.color, colorHex: c.colorHex, stock }))
        ),
      },
    },
  });
  return NextResponse.json({ product }, { status: 201 });
}
