import { z } from "zod";
import { normalizeHeightSize } from "@/lib/sizes";
import { nearestUkrainianColorName, normalizeHex } from "@/lib/color";

const imagePath = z
  .string()
  .min(1)
  .refine(
    (v) =>
      v.startsWith("/uploads/") ||
      v.startsWith("/api/media/") ||
      /^https?:\/\//.test(v),
    "Невірний шлях зображення"
  );

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Невірний HEX кольору");

export const colorSizeSchema = z.object({
  size: z.string().min(1),
  stock: z.number().int().min(0),
});

export const productColorInputSchema = z.object({
  name: z.string().min(1).optional(),
  colorHex: hexColor,
  images: z.array(imagePath).min(1),
  sizes: z.array(colorSizeSchema).min(1),
});

export const productColorsSchema = z.array(productColorInputSchema).min(1);

export type ProductColorInput = z.infer<typeof productColorInputSchema>;

export function normalizeProductColors(colors: ProductColorInput[]) {
  const seen = new Set<string>();
  const normalized = [];

  for (const c of colors) {
    const hex = (normalizeHex(c.colorHex) ?? c.colorHex).toUpperCase();
    if (seen.has(hex)) continue;
    seen.add(hex);

    const sizeMap = new Map<string, number>();
    for (const row of c.sizes) {
      const size = normalizeHeightSize(row.size);
      if (!size) continue;
      sizeMap.set(size, row.stock);
    }
    if (sizeMap.size === 0) continue;

    normalized.push({
      name: (c.name?.trim() && !normalizeHex(c.name) ? c.name.trim() : nearestUkrainianColorName(hex)).slice(
        0,
        80
      ),
      colorHex: hex,
      images: c.images,
      sizes: Array.from(sizeMap, ([size, stock]) => ({ size, stock })),
    });
  }

  return normalized;
}

export { imagePath, hexColor };
