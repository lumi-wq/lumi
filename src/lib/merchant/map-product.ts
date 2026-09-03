import { displayColorName } from "@/lib/color";
import { BRAND } from "@/lib/seo";
import { parseHeightCm } from "@/lib/sizes";
import { unitWeightKg } from "@/lib/shipping-weight";
import { PRODUCTION_ORIGIN } from "@/lib/site";
import type { ProductInputPayload } from "./client";
import { getMerchantConfig } from "./config";
import { merchantShippingAttributes } from "./shipping";

export type MerchantProductSource = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  isSale: boolean;
  gender: "BOY" | "GIRL";
  materials: string | null;
  productType: { slug: string; name: string; unisex: boolean } | null;
  colors: { id: string; name: string; colorHex: string; images: string[] }[];
  variants: {
    size: string;
    color: string;
    colorHex: string;
    stock: number;
    colorId: string | null;
  }[];
};

const GOOGLE_CATEGORY: Record<string, string> = {
  outerwear: "203",
  sportswear: "5329",
  suits: "1594",
  sets: "5598",
  tshirts: "212",
  shirts: "212",
  pants: "204",
  shorts: "207",
  dresses: "2271",
  footwear: "187",
  hats: "173",
  caps: "173",
  bags: "104",
  glasses: "524",
};

function publicUrl(pathOrUrl: string): string {
  const rewritten = pathOrUrl.replace("/api/media/", "/media/");
  if (/^https?:\/\//i.test(rewritten)) return rewritten;
  const path = rewritten.startsWith("/") ? rewritten : `/${rewritten}`;
  return `${PRODUCTION_ORIGIN}${path}`;
}

function hryvniaToMicros(uah: number): string {
  return String(Math.round(uah) * 1_000_000);
}

function hexKey(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

function ageGroup(sizeCm: number | null): "TODDLER" | "KIDS" | "ADULT" {
  if (sizeCm != null && sizeCm < 104) return "TODDLER";
  if (sizeCm != null && sizeCm >= 164) return "ADULT";
  return "KIDS";
}

export function merchantOfferId(productId: string, colorHex: string, size: string): string {
  const cm = parseHeightCm(size);
  const sizePart = cm != null ? String(cm) : size.replace(/\s+/g, "");
  return `lumi-${productId}-${hexKey(colorHex)}-${sizePart}`;
}

export function merchantItemGroupId(productId: string): string {
  return `lumi-${productId}`;
}

export function offerIdPrefix(productId: string): string {
  return `lumi-${productId}-`;
}

export async function mapProductToInputs(
  product: MerchantProductSource
): Promise<ProductInputPayload[]> {
  const config = getMerchantConfig();
  if (!config) return [];

  const colorsById = new Map(product.colors.map((c) => [c.id, c]));
  const gender = product.productType?.unisex
    ? "UNISEX"
    : product.gender === "GIRL"
      ? "FEMALE"
      : "MALE";
  const typeSlug = product.productType?.slug ?? "";
  const typeName = product.productType?.name;
  const categoryId = GOOGLE_CATEGORY[typeSlug] ?? "1604";
  const weightKg = unitWeightKg(typeSlug);
  const productTypePath = typeName ? `Одяг > ${typeName}` : "Одяг";
  const shippingAttrs = await merchantShippingAttributes(weightKg, product.price);

  const seen = new Set<string>();
  const inputs: ProductInputPayload[] = [];

  for (const variant of product.variants) {
    const offerId = merchantOfferId(product.id, variant.colorHex, variant.size);
    if (seen.has(offerId)) continue;
    seen.add(offerId);

    const color = variant.colorId ? colorsById.get(variant.colorId) : undefined;
    const images = (color?.images?.length ? color.images : product.images)
      .map(publicUrl)
      .filter(Boolean);
    const imageLink = images[0];
    if (!imageLink) continue;

    const sizeCm = parseHeightCm(variant.size);
    const title = [product.name, variant.size].filter(Boolean).join(", ").slice(0, 150);
    const description = product.description.replace(/\s+/g, " ").trim().slice(0, 5000);
    const inStock = variant.stock > 0;
    const colorLabel = displayColorName(
      color?.name || variant.color,
      color?.colorHex || variant.colorHex
    );

    const productAttributes: Record<string, unknown> = {
      title,
      description,
      link: `${PRODUCTION_ORIGIN}/product/${product.slug}`,
      canonicalLink: `${PRODUCTION_ORIGIN}/product/${product.slug}`,
      imageLink,
      availability: inStock ? "IN_STOCK" : "OUT_OF_STOCK",
      condition: "NEW",
      brand: BRAND,
      identifierExists: false,
      gender,
      ageGroup: ageGroup(sizeCm),
      color: colorLabel,
      size: variant.size,
      sizeSystem: "EU",
      sizeTypes: ["REGULAR"],
      itemGroupId: merchantItemGroupId(product.id),
      googleProductCategory: categoryId,
      productTypes: [productTypePath],
      price: {
        amountMicros: hryvniaToMicros(product.price),
        currencyCode: "UAH",
      },
      ...shippingAttrs,
      shippingWeight: { value: weightKg, unit: "kg" },
      sellOnGoogleQuantity: String(Math.max(0, variant.stock)),
    };

    if (images.length > 1) {
      productAttributes.additionalImageLinks = images.slice(1, 11);
    }

    if (product.compareAtPrice != null && product.compareAtPrice > product.price) {
      productAttributes.salePrice = {
        amountMicros: hryvniaToMicros(product.price),
        currencyCode: "UAH",
      };
      productAttributes.price = {
        amountMicros: hryvniaToMicros(product.compareAtPrice),
        currencyCode: "UAH",
      };
    }

    if (product.materials?.trim()) {
      productAttributes.material = product.materials.trim().slice(0, 200);
    }
    if (product.isSale) productAttributes.customLabel0 = "sale";
    if (typeSlug) productAttributes.customLabel1 = typeSlug;

    inputs.push({
      offerId,
      contentLanguage: config.contentLanguage,
      feedLabel: config.feedLabel,
      productAttributes,
    });
  }

  return inputs;
}
