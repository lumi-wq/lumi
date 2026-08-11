export type PaymentOrder = {
  id: string;
  number: string;
  total: number;
  description: string;
};

export type PaymentResult = {
  redirectUrl: string;
  provider: string;
};

export interface PaymentProvider {
  readonly name: string;
  createPayment(order: PaymentOrder): Promise<PaymentResult>;
}

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Мок для локальної розробки: одразу на сторінку успіху. */
class MockProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    return {
      redirectUrl: `${siteUrl()}/checkout/success?order=${order.number}&paid=1`,
      provider: this.name,
    };
  }
}

/**
 * Monobank Acquiring — хостована сторінка оплати з Visa/Mastercard,
 * Apple Pay та Google Pay (https://api.monobank.ua/docs/acquiring.html).
 */
class MonobankProvider implements PaymentProvider {
  readonly name = "monobank";

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    const token = process.env.MONOBANK_TOKEN;
    if (!token) throw new Error("MONOBANK_TOKEN не налаштований");
    const res = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
      method: "POST",
      headers: { "X-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: order.total * 100, // копійки
        ccy: 980,
        merchantPaymInfo: {
          reference: order.number,
          destination: order.description,
        },
        redirectUrl: `${siteUrl()}/checkout/success?order=${order.number}`,
        webHookUrl: `${siteUrl()}/api/payment/callback`,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Monobank: ${res.status}${detail ? ` — ${detail}` : ""}`);
    }
    const json = (await res.json()) as { pageUrl: string };
    return { redirectUrl: json.pageUrl, provider: this.name };
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENT_PROVIDER === "monobank") {
    return new MonobankProvider();
  }
  return new MockProvider();
}
