import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  imagePath,
  normalizeProductColors,
  productColorsSchema,
} from "@/lib/product-colors";
import { expireFeaturedProducts } from "@/lib/featured";
import { allocateProductSlug, prismaErrorResponse } from "@/lib/product-slug";
import { productTypeGenderError } from "@/lib/product-types";
import { syncProductToMerchantQuiet } from "@/lib/merchant/sync";

export const maxDuration = 60;

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  await expireFeaturedProducts();
  const products = await prisma.product.findMany({
    include: {
      category: true,
      productType: true,
      colors: { orderBy: { sortOrder: "asc" } },
      variants: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

const productSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().min(1),
    price: z.number().int().min(1),
    compareAtPrice: z.number().int().min(1).nullable().optional(),
    categoryId: z.string().min(1),
    images: z.array(imagePath).optional(),
    tag: z.string().nullable().optional(),
    tagStyle: z.string().optional(),
    materials: z.string().optional(),
    isFeatured: z.boolean().optional(),
    isSale: z.boolean().optional(),
    gender: z.enum(["BOY", "GIRL"]),
    productTypeId: z.string().min(1),
    colors: productColorsSchema,
  })
  .superRefine((data, ctx) => {
    if (data.compareAtPrice != null && data.compareAtPrice <= data.price) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "Стара ціна має бути вищою за поточну",
      });
    }
    const normalized = normalizeProductColors(data.colors);
    if (normalized.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["colors"],
        message: "Додайте хоча б один колір з фото та розмірами",
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
  const { colors: rawColors, images: _ignored, ...data } = parsed.data;
  const colors = normalizeProductColors(rawColors);
  if (colors.length === 0) {
    return NextResponse.json({ error: "Додайте колір з фото та розмірами" }, { status: 400 });
  }

  const productType = await prisma.productType.findUnique({ where: { id: data.productTypeId } });
  if (!productType) {
    return NextResponse.json({ error: "Категорію не знайдено" }, { status: 400 });
  }
  const genderError = productTypeGenderError(productType, data.gender);
  if (genderError) {
    return NextResponse.json({ error: genderError }, { status: 400 });
  }

  const previewImages = colors[0].images;
  if (data.isFeatured && data.isSale) {
    return NextResponse.json(
      { error: "Товар не може бути одночасно в «Новинках» і «Розпродажі»" },
      { status: 400 }
    );
  }
  const isFeatured = Boolean(data.isFeatured);
  const isSale = Boolean(data.isSale);

  try {
    const slug = await allocateProductSlug(prisma, data.slug);
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...data,
          slug,
          isFeatured,
          isSale,
          featuredAt: isFeatured ? new Date() : null,
          images: previewImages,
        },
      });

      for (let i = 0; i < colors.length; i++) {
        const c = colors[i];
        const colorRow = await tx.productColor.create({
          data: {
            productId: created.id,
            name: c.name,
            colorHex: c.colorHex,
            images: c.images,
            sortOrder: i,
          },
        });
        await tx.productVariant.createMany({
          data: c.sizes.map((s) => ({
            productId: created.id,
            colorId: colorRow.id,
            size: s.size,
            color: c.name,
            colorHex: c.colorHex,
            stock: s.stock,
          })),
        });
      }

      return created;
    });

    await syncProductToMerchantQuiet(product.id);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("[admin/products POST]", err);
    const { error, status } = prismaErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
