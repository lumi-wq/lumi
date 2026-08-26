import { sendSms } from "@/lib/sms";

export function orderPaidSmsText(order: { number: string; total: number }): string {
  return `LUMI: замовлення ${order.number} оплачено, ${order.total} грн. Статус — lumi.kids/orders`;
}

/** Транзакційне SMS після успішної оплати. Помилка не валить checkout. */
export async function notifyOrderPaid(order: {
  number: string;
  phone: string;
  total: number;
}): Promise<void> {
  try {
    await sendSms(order.phone, orderPaidSmsText(order));
    console.log("[sms] order paid ok", order.number);
  } catch (err) {
    console.error("[sms] order paid", order.number, err);
  }
}
