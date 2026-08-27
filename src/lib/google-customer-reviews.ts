import { getDispatchDate } from "@/lib/dispatch-date";

/** Merchant Center ID — публічний, той самий що в кабінеті Google Відгуки клієнтів. */
export const GCR_MERCHANT_ID = Number(
  process.env.NEXT_PUBLIC_GOOGLE_CUSTOMER_REVIEWS_MERCHANT_ID ?? "5842460557"
);

/** Збігається з maxTransitTime у фіді Merchant. */
const MAX_TRANSIT_DAYS = 4;

/**
 * Лише бойовий lumi.kids: на preview / localhost Google відхиляє модуль
 * (інший домен, ніж заявлений у Merchant Center).
 */
export function isGoogleCustomerReviewsEnabled() {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV;
  return env === "production";
}

/** Остання орієнтовна дата прибуття Новою Поштою, YYYY-MM-DD (час Києва). */
export function estimatedDeliveryDateIso(orderedAt: Date): string {
  const dispatch = getDispatchDate(orderedAt);
  const delivery = new Date(dispatch);
  delivery.setUTCDate(delivery.getUTCDate() + MAX_TRANSIT_DAYS);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(delivery);
}
