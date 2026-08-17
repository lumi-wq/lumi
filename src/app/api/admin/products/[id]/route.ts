import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  imagePath,
  normalizeProductColors,
  productColorsSchema,
} from "@/lib/product-colors";
import { isFeaturedActive } from "@/lib/featured";
import { resolveStorefrontPrices } from "@/lib/storefront-price";

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    basePrice: z.number().int().min(1).optional(),
    compareAtBasePrice: z.number().int().min(1).nullable().optional(),
    categoryId: z.string().min(1).optional(),
    images: z.array(imagePath).optional(),
    tag: z.string().nullable().optional(),
    tagStyle: z.string().optional(),
    materials: z.string().optional(),
    isFeatured: z.boolean().optional(),
    isSale: z.boolean().optional(),
    gender: z.enum(["BOY", "GIRL"]).optional(),
    productTypeId: z.string().min(1).nullable().optional(),
    colors: productColorsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.compareAtBasePrice != null &&
      data.basePrice != null &&
      data.compareAtBasePrice <= data.basePrice
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtBasePrice"],
        message: "Стара базова ціна має бути вищою за поточну базову",
      });
    }
    if (data.colors) {
      const normalized = normalizeProductColors(data.colors);
      if (normalized.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["colors"],
          message: "Додайте хоча б один колір з фото та розмірами",
        });
      }
    }
  });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }
  const {
    colors: rawColors,
    images: _ignored,
    basePrice: basePriceIn,
    compareAtBasePrice: compareAtBaseIn,
    ...data
  } = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      gender: true,
      productTypeId: true,
      isFeatured: true,
      featuredAt: true,
      basePrice: true,
      compareAtBasePrice: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Не знайдено" }, { status: 404 });
  }

  if (data.productTypeId || data.gender) {
    const gender = data.gender ?? existing.gender;
    const productTypeId = data.productTypeId ?? existing.productTypeId;
    if (productTypeId) {
      const productType = await prisma.productType.findUnique({ where: { id: productTypeId } });
      if (productType?.girlOnly && !productType.unisex && gender !== "GIRL") {
        return NextResponse.json(
          { error: `«${productType.name}» доступні лише для дівчаток` },
          { status: 400 }
        );
      }
    }
  }

  if (data.isFeatured === true && data.isSale === true) {
    return NextResponse.json(
      { error: "Товар не може бути одночасно в «Новинках» і «Розпродажі»" },
      { status: 400 }
    );
  }

  let featuredPatch: {
    isFeatured?: boolean;
    featuredAt?: Date | null;
    isSale?: boolean;
  } = {};

  if (data.isFeatured === true) {
    featuredPatch = isFeaturedActive(existing)
      ? { isFeatured: true, isSale: false }
      : { isFeatured: true, featuredAt: new Date(), isSale: false };
  } else if (data.isFeatured === false) {
    featuredPatch = { isFeatured: false, featuredAt: null };
  }

  if (data.isSale === true) {
    featuredPatch = {
      ...featuredPatch,
      isSale: true,
      isFeatured: false,
      featuredAt: null,
    };
  } else if (data.isSale === false) {
    featuredPatch = { ...featuredPatch, isSale: false };
  }

  const { isFeatured: _isFeatured, isSale: _isSale, ...rest } = data;
  const colors = rawColors ? normalizeProductColors(rawColors) : null;

  const priceFieldsTouched = basePriceIn !== undefined || compareAtBaseIn !== undefined;
  let pricePatch: ReturnType<typeof resolveStorefrontPrices> | Record<string, never> = {};
  if (priceFieldsTouched) {
    try {
      pricePatch = resolveStorefrontPrices({
        basePrice: basePriceIn ?? existing.basePrice,
        compareAtBasePrice:
          compareAtBaseIn !== undefined ? compareAtBaseIn : existing.compareAtBasePrice,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Невірні ціни" },
        { status: 400 }
      );
    }
  }

  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...featuredPatch,
        ...pricePatch,
        ...(colors ? { images: colors[0].images } : {}),
      },
    });

    if (colors) {
      await tx.productVariant.deleteMany({ where: { productId: params.id } });
      await tx.productColor.deleteMany({ where: { productId: params.id } });

      for (let i = 0; i < colors.length; i++) {
        const c = colors[i];
        const colorRow = await tx.productColor.create({
          data: {
            productId: params.id,
            name: c.name,
            colorHex: c.colorHex,
            images: c.images,
            sortOrder: i,
          },
        });
        await tx.productVariant.createMany({
          data: c.sizes.map((s) => ({
            productId: params.id,
            colorId: colorRow.id,
            size: s.size,
            color: c.name,
            colorHex: c.colorHex,
            stock: s.stock,
          })),
        });
      }
    }

    return updated;
  });

  return NextResponse.json({ product });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
