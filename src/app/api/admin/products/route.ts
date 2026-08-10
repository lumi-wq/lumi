import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const products = await prisma.product.findMany({
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().min(1),
  categoryId: z.string().min(1),
  images: z.array(z.string().url()).min(1),
  tag: z.string().nullable().optional(),
  tagStyle: z.string().optional(),
  materials: z.string().optional(),
  isFeatured: z.boolean().optional(),
  sizes: z.array(z.string().min(1)).min(1),
  colors: z.array(z.object({ color: z.string().min(1), colorHex: z.string().min(4) })).min(1),
  stock: z.number().int().min(0).default(10),
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані товару" }, { status: 400 });
  }
  const { sizes, colors, stock, ...data } = parsed.data;
  const product = await prisma.product.create({
    data: {
      ...data,
      variants: {
        create: sizes.flatMap((size) =>
          colors.map((c) => ({ size, color: c.color, colorHex: c.colorHex, stock }))
        ),
      },
    },
  });
  return NextResponse.json({ product }, { status: 201 });
}
