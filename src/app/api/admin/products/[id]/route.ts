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
import { allocateProductSlug, prismaErrorResponse } from "@/lib/product-slug";
import { productTypeGenderError } from "@/lib/product-types";
import { removeProductFromMerchantQuiet, syncProductToMerchantQuiet } from "@/lib/merchant/sync";

export const maxDuration = 60;

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    price: z.number().int().min(1).optional(),
    compareAtPrice: z.number().int().min(1).nullable().optional(),
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
  const { colors: rawColors, images: _ignored, ...data } = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      gender: true,
      productTypeId: true,
      isFeatured: true,
      featuredAt: true,
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
      const genderError = productType ? productTypeGenderError(productType, gender) : null;
      if (genderError) {
        return NextResponse.json({ error: genderError }, { status: 400 });
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

  try {
    const slug = rest.slug
      ? await allocateProductSlug(prisma, rest.slug, params.id)
      : undefined;
    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: params.id },
        data: {
          ...rest,
          ...(slug ? { slug } : {}),
          ...featuredPatch,
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

    await syncProductToMerchantQuiet(product.id);
    return NextResponse.json({ product });
  } catch (err) {
    console.error("[admin/products PATCH]", err);
    const { error, status } = prismaErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  await removeProductFromMerchantQuiet(params.id);
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
