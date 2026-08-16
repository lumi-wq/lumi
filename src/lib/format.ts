export const SHIPPING_FEE = 80;

export function formatPrice(value: number): string {
  return `${value.toLocaleString("en-US")} ₴`;
}

/** Відсоток знижки, якщо є стара ціна вища за поточну. */
export function discountPercent(price: number, compareAtPrice: number | null | undefined): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function productCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} товари`;
  return `${count} товарів`;
}
