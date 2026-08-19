/**
 * Розміри одягу LUMI — за ростом (см).
 *
 * Об’єднані сітки виробників:
 * - крок 5 см (110–190) — гнучкість при створенні товару
 * - крок 6 см (98–176) — класична дитяча сітка UA/EU
 * - крок 10 см (110–190) — поширений крок у каталогах
 */

function range(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let n = from; n <= to; n += step) out.push(n);
  return out;
}

const BY_5 = range(110, 190, 5);
const BY_6 = range(98, 176, 6);
const BY_10 = range(110, 190, 10);

/** Усі доступні значення росту (см), відсортовані. */
export const HEIGHT_CM_VALUES: readonly number[] = Array.from(
  new Set([...BY_5, ...BY_6, ...BY_10])
).sort((a, b) => a - b);

export function formatHeightSize(cm: number): string {
  return `${cm} см`;
}

/** Підписи для UI / зберігання у ProductVariant.size */
export const HEIGHT_SIZES: readonly string[] = HEIGHT_CM_VALUES.map(formatHeightSize);

/** Типовий набір при створенні товару (класична 6 см сітка). */
export const DEFAULT_HEIGHT_SIZES: readonly string[] = range(116, 176, 6).map(formatHeightSize);

export function parseHeightCm(size: string): number | null {
  const trimmed = size.trim();
  const withUnit = trimmed.match(/^(\d{2,3})\s*см$/i);
  if (withUnit) return Number(withUnit[1]);
  if (/^\d{2,3}$/.test(trimmed)) return Number(trimmed);
  return null;
}

export function compareSizes(a: string, b: string): number {
  const ca = parseHeightCm(a);
  const cb = parseHeightCm(b);
  if (ca != null && cb != null) return ca - cb;
  return a.localeCompare(b, "uk");
}

export function isValidHeightSize(size: string): boolean {
  const cm = parseHeightCm(size);
  return cm != null && HEIGHT_CM_VALUES.includes(cm);
}

/** Нормалізує введення до канонічного «140 см». */
export function normalizeHeightSize(size: string): string | null {
  const cm = parseHeightCm(size);
  if (cm == null || !HEIGHT_CM_VALUES.includes(cm)) return null;
  return formatHeightSize(cm);
}

/** Приблизний мапінг старих вікових розмірів → ріст (для міграції). */
export const LEGACY_AGE_TO_HEIGHT_CM: Record<string, number> = {
  "6 років": 116,
  "7 років": 122,
  "8 років": 128,
  "9 років": 134,
  "10 років": 140,
  "11 років": 146,
  "12 років": 152,
  "13 років": 158,
  "14 років": 164,
  "15 років": 170,
  "16 років": 176,
};

/** Довідник для таблиці розмірів: вік (орієнтир) ↔ ріст. */
export const SIZE_CHART: readonly { age: number; heightCm: number; heightRange: string }[] = [
  { age: 3, heightCm: 98, heightRange: "94–102" },
  { age: 4, heightCm: 104, heightRange: "100–108" },
  { age: 5, heightCm: 110, heightRange: "106–114" },
  { age: 6, heightCm: 116, heightRange: "110–118" },
  { age: 7, heightCm: 122, heightRange: "118–124" },
  { age: 8, heightCm: 128, heightRange: "124–130" },
  { age: 9, heightCm: 134, heightRange: "130–136" },
  { age: 10, heightCm: 140, heightRange: "136–142" },
  { age: 11, heightCm: 146, heightRange: "142–148" },
  { age: 12, heightCm: 152, heightRange: "148–154" },
  { age: 13, heightCm: 158, heightRange: "154–160" },
  { age: 14, heightCm: 164, heightRange: "160–166" },
  { age: 15, heightCm: 170, heightRange: "166–172" },
  { age: 16, heightCm: 176, heightRange: "172–180" },
];
