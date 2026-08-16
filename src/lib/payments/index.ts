import { createVerify } from "crypto";

export type PaymentOrder = {
  id: string;
  number: string;
  total: number;
  description: string;
};

export type PaymentResult = {
  redirectUrl: string;
  provider: string;
  invoiceId?: string;
};

export interface PaymentProvider {
  readonly name: string;
  createPayment(order: PaymentOrder): Promise<PaymentResult>;
}

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const MONO_API = "https://api.monobank.ua";

/** Мок для локальної розробки без банку. */
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
 * plata by mono / Monopay (інтернет-еквайринг Monobank).
 * Хостована сторінка: Visa/Mastercard, Apple Pay, Google Pay.
 * @see https://monobank.ua/api-docs/acquiring
 */
class MonobankProvider implements PaymentProvider {
  readonly name = "monobank";

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    const token = process.env.MONOBANK_TOKEN;
    if (!token) throw new Error("MONOBANK_TOKEN не налаштований");

    const amountKopiyky = Math.round(order.total * 100);
    if (!Number.isFinite(amountKopiyky) || amountKopiyky < 100) {
      throw new Error("Сума замовлення занадто мала для оплати");
    }

    const base = siteUrl().replace(/\/$/, "");
    const res = await fetch(`${MONO_API}/api/merchant/invoice/create`, {
      method: "POST",
      headers: { "X-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountKopiyky,
        ccy: 980,
        merchantPaymInfo: {
          reference: order.number,
          destination: order.description,
        },
        redirectUrl: `${base}/checkout/success?order=${encodeURIComponent(order.number)}`,
        webHookUrl: `${base}/api/payment/callback`,
        validity: 3600,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Monobank: ${res.status}${detail ? ` — ${detail}` : ""}`);
    }

    const json = (await res.json()) as { pageUrl?: string; invoiceId?: string };
    if (!json.pageUrl) throw new Error("Monobank: немає pageUrl у відповіді");

    return {
      redirectUrl: json.pageUrl,
      provider: this.name,
      invoiceId: json.invoiceId,
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENT_PROVIDER === "monobank") {
    return new MonobankProvider();
  }
  return new MockProvider();
}

/** Статуси інвойсу Monobank, при яких вважаємо оплату успішною. */
export function isMonobankPaymentSuccess(status: string | undefined): boolean {
  return status?.toLowerCase() === "success";
}

export function extractMonobankOrderReference(payload: Record<string, unknown>): string | undefined {
  if (typeof payload.reference === "string" && payload.reference) return payload.reference;
  const info = payload.merchantPaymInfo;
  if (info && typeof info === "object" && info !== null) {
    const ref = (info as { reference?: unknown }).reference;
    if (typeof ref === "string" && ref) return ref;
  }
  return undefined;
}

let cachedPubKeyPem: string | null = null;
let cachedPubKeyAt = 0;
const PUBKEY_TTL_MS = 60 * 60 * 1000;

async function fetchMonobankPubKeyPem(token: string): Promise<string> {
  const now = Date.now();
  if (cachedPubKeyPem && now - cachedPubKeyAt < PUBKEY_TTL_MS) return cachedPubKeyPem;

  const res = await fetch(`${MONO_API}/api/merchant/pubkey`, {
    headers: { "X-Token": token },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Не вдалося отримати pubkey Monobank: ${res.status}`);

  const json = (await res.json()) as { key?: string };
  if (!json.key) throw new Error("Monobank pubkey: порожня відповідь");

  // API повертає base64(PEM) або вже PEM
  let pem = json.key;
  if (!pem.includes("BEGIN")) {
    pem = Buffer.from(pem, "base64").toString("utf8");
  }

  cachedPubKeyPem = pem;
  cachedPubKeyAt = now;
  return pem;
}

/**
 * Перевірка заголовка X-Sign (ECDSA / SHA256) за документацією Monobank.
 * Повертає false, якщо підпис відсутній або невалідний.
 */
export async function verifyMonobankWebhookSignature(
  rawBody: Buffer,
  xSignHeader: string | null
): Promise<boolean> {
  if (!xSignHeader) return false;
  const token = process.env.MONOBANK_TOKEN;
  if (!token) return false;

  try {
    const pem = await fetchMonobankPubKeyPem(token);
    const signature = Buffer.from(xSignHeader, "base64");
    const verify = createVerify("SHA256");
    verify.update(rawBody);
    verify.end();
    return verify.verify(pem, signature);
  } catch {
    return false;
  }
}
