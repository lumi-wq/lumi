import { SHIPPING_FEE } from "@/lib/format";

/**
 * Амортизація комісії MonoPay і потенційних повернень у вітринну ціну.
 *
 * P = (B + r·S) / ((1−r)(1−c) − r·k·c), далі округлення вгору до кроку 50 або 100 ₴.
 * B — базова ціна (адмінка), P — ціна на сайті.
 */
export const PRICING = {
  /** Комісія MonoPay з суми транзакції */
  paymentFeeRate: Number(process.env.PRICE_PAYMENT_FEE ?? "0.013"),
  /** Скільки разів комісія «з’їдається» на шляху оплата+повернення */
  refundFeeMultiplier: Number(process.env.PRICE_REFUND_FEE_MULTIPLIER ?? "2"),
  /** Очікувана частка повернень */
  expectedReturnRate: Number(process.env.PRICE_RETURN_RATE ?? "0.15"),
  /** Середня вартість зворотної доставки НП, грн */
  avgReturnShippingUah: Number(process.env.PRICE_AVG_RETURN_SHIPPING ?? String(SHIPPING_FEE)),
  /** Крок округлення вітринної ціни вгору: 50 або 100 */
  roundTo: Number(process.env.PRICE_ROUND_TO ?? "50"),
} as const;

function clampRate(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value < 0) return fallback;
  return value;
}

function resolveRoundTo(value: number): 50 | 100 {
  return value >= 100 ? 100 : 50;
}

export function getPricingConfig() {
  const c = clampRate(PRICING.paymentFeeRate, 0.013);
  const k = clampRate(PRICING.refundFeeMultiplier, 2);
  const r = clampRate(PRICING.expectedReturnRate, 0.15);
  const S = Math.max(0, Math.round(clampRate(PRICING.avgReturnShippingUah, SHIPPING_FEE)));
  const roundTo = resolveRoundTo(PRICING.roundTo);
  return { c, k, r, S, roundTo };
}

/** Округлення вгору до кроку 50 або 100 ₴ (не занижуємо амортизовану ціну). */
export function roundStorefrontPrice(value: number, roundTo: 50 | 100 = getPricingConfig().roundTo): number {
  const step = roundTo;
  const n = Math.max(1, value);
  return Math.max(step, Math.ceil(n / step) * step);
}

/** Знаменник формули: частка «чистої» виручки на 1 грн вітринної ціни. */
export function storefrontPriceFactor(): number {
  const { c, k, r } = getPricingConfig();
  const denom = (1 - r) * (1 - c) - r * k * c;
  if (denom <= 0.01) {
    throw new Error("Некоректні параметри ціноутворення: занадто високий % повернень/комісій");
  }
  return denom;
}

/** Базова ціна магазину → ціна на вітрині (грн, з округленням). */
export function toStorefrontPrice(basePrice: number): number {
  const base = Math.max(1, Math.round(basePrice));
  const { r, S, roundTo } = getPricingConfig();
  const raw = (base + r * S) / storefrontPriceFactor();
  return roundStorefrontPrice(raw, roundTo);
}

export function toStorefrontCompareAt(compareAtBase: number | null | undefined): number | null {
  if (compareAtBase == null || !Number.isFinite(compareAtBase)) return null;
  return toStorefrontPrice(compareAtBase);
}

export type ResolvedPrices = {
  basePrice: number;
  compareAtBasePrice: number | null;
  price: number;
  compareAtPrice: number | null;
};

/** Валідація баз + розрахунок вітринних цін. */
export function resolveStorefrontPrices(input: {
  basePrice: number;
  compareAtBasePrice?: number | null;
}): ResolvedPrices {
  const basePrice = Math.round(input.basePrice);
  if (!Number.isFinite(basePrice) || basePrice < 1) {
    throw new Error("Базова ціна має бути ≥ 1 ₴");
  }

  let compareAtBasePrice: number | null =
    input.compareAtBasePrice == null || input.compareAtBasePrice === undefined
      ? null
      : Math.round(input.compareAtBasePrice);

  if (compareAtBasePrice != null) {
    if (compareAtBasePrice < 1) compareAtBasePrice = null;
    else if (compareAtBasePrice <= basePrice) {
      throw new Error("Стара базова ціна має бути вищою за поточну базову");
    }
  }

  const { roundTo } = getPricingConfig();
  const price = toStorefrontPrice(basePrice);
  let compareAtPrice = toStorefrontCompareAt(compareAtBasePrice);
  if (compareAtPrice != null && compareAtPrice <= price) {
    // Після однакового округлення стара ціна має лишатися вищою
    compareAtPrice = price + roundTo;
  }

  return { basePrice, compareAtBasePrice, price, compareAtPrice };
}

/** Короткий опис для адмінки (без розкриття формули покупцю). */
export function pricingAdminHint(): string {
  const { c, k, r, S, roundTo } = getPricingConfig();
  const pct = (n: number) => `${(n * 100).toFixed((n * 100) % 1 === 0 ? 0 : 1)}%`;
  return `Вітрина = амортизація (комісія ${pct(c)}×${k}, повернення ~${pct(r)}, зворотна НП ~${S} ₴) + округлення вгору до ${roundTo} ₴`;
}
