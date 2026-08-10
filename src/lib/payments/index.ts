import crypto from "node:crypto";

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

/** Мок-провайдер для розробки: одразу перекидає на сторінку успіху. */
class MockProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    return {
      redirectUrl: `${siteUrl()}/checkout/success?order=${order.number}&paid=1`,
      provider: this.name,
    };
  }
}

/** LiqPay: формує підписане checkout-посилання (https://www.liqpay.ua/documentation). */
class LiqPayProvider implements PaymentProvider {
  readonly name = "liqpay";

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    const publicKey = process.env.LIQPAY_PUBLIC_KEY;
    const privateKey = process.env.LIQPAY_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      throw new Error("LIQPAY_PUBLIC_KEY / LIQPAY_PRIVATE_KEY не налаштовані");
    }
    const params = {
      version: 3,
      public_key: publicKey,
      action: "pay",
      amount: order.total,
      currency: "UAH",
      description: order.description,
      order_id: order.number,
      result_url: `${siteUrl()}/checkout/success?order=${order.number}`,
      server_url: `${siteUrl()}/api/payment/callback`,
    };
    const data = Buffer.from(JSON.stringify(params)).toString("base64");
    const signature = crypto
      .createHash("sha1")
      .update(privateKey + data + privateKey)
      .digest("base64");
    return {
      redirectUrl: `https://www.liqpay.ua/api/3/checkout?data=${encodeURIComponent(
        data
      )}&signature=${encodeURIComponent(signature)}`,
      provider: this.name,
    };
  }
}

/** Monobank Acquiring: створює інвойс (https://api.monobank.ua/docs/acquiring.html). */
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
    if (!res.ok) throw new Error(`Monobank: ${res.status}`);
    const json = (await res.json()) as { pageUrl: string };
    return { redirectUrl: json.pageUrl, provider: this.name };
  }
}

export function getPaymentProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    case "liqpay":
      return new LiqPayProvider();
    case "monobank":
      return new MonobankProvider();
    default:
      return new MockProvider();
  }
}
