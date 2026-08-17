/** Замовлення відкриті лише коли явно увімкнено. За замовчуванням — каталог без checkout. */
export function ordersEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ORDERS_ENABLED === "true";
}

export const ORDERS_CLOSED_TITLE = "Замовлення скоро відкриємо";

export const ORDERS_CLOSED_MESSAGE =
  "Оплату та доставку ще налаштовуємо. Товари вже можна переглядати — оформити покупку поки що не вийде.";
