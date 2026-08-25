/** Прихований товар для перевірки бойової оплати (1 ₴, без доставки). */
export const TEST_PAYMENT_SLUG = "test-oplata";

export function isTestPaymentSlug(slug: string | null | undefined): boolean {
  return slug === TEST_PAYMENT_SLUG;
}

export function cartIsTestPaymentOnly(slugs: Array<string | null | undefined>): boolean {
  return slugs.length > 0 && slugs.every(isTestPaymentSlug);
}
