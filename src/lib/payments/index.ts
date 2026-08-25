import { createVerify } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site";

export type PaymentBasketLine = {
  name: string;
  qty: number;
  unitPrice: number;
  code?: string;
};

export type PaymentOrder = {
  id: string;
  number: string;
  total: number;
  description: string;
  items?: PaymentBasketLine[];
  shipping?: number;
  customerEmail?: string | null;
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

const MONO_API = "https://api.monobank.ua";

function toKopiyky(hryvnia: number): number {
  return Math.round(hryvnia * 100);
}

function publicOrigin(): string {
  return getSiteUrl().replace(/\/$/, "");
}

/** Мок для локальної розробки без банку. */
class MockProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    return {
      redirectUrl: `${publicOrigin()}/checkout/success?order=${order.number}&paid=1`,
      provider: this.name,
    };
  }
}

type MonoBasketItem = {
  name: string;
  qty: number;
  sum: number;
  total: number;
  unit: string;
  code: string;
};

function buildBasket(order: PaymentOrder): MonoBasketItem[] {
  const lines: MonoBasketItem[] = (order.items ?? []).map((item) => {
    const sum = toKopiyky(item.unitPrice);
    return {
      name: item.name.slice(0, 120),
      qty: item.qty,
      sum,
      total: sum * item.qty,
      unit: "шт.",
      code: (item.code ?? item.name).slice(0, 64),
    };
  });

  if (order.shipping && order.shipping > 0) {
    const sum = toKopiyky(order.shipping);
    lines.push({
      name: "Доставка Нова Пошта",
      qty: 1,
      sum,
      total: sum,
      unit: "шт.",
      code: "shipping",
    });
  }

  const basketSum = lines.reduce((acc, line) => acc + line.total, 0);
  const amount = toKopiyky(order.total);
  const delta = amount - basketSum;
  // Від'ємні позиції Mono може відхилити — знижку лишаємо лише в amount.
  if (lines.length > 0 && delta > 0) {
    lines.push({
      name: "Коригування",
      qty: 1,
      sum: delta,
      total: delta,
      unit: "шт.",
      code: "adjust",
    });
  }

  return lines;
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

    const amountKopiyky = toKopiyky(order.total);
    if (!Number.isFinite(amountKopiyky) || amountKopiyky < 100) {
      throw new Error("Сума замовлення занадто мала для оплати");
    }

    const base = publicOrigin();
    const basketOrder = buildBasket(order);
    const merchantPaymInfo: Record<string, unknown> = {
      reference: order.number,
      destination: order.description,
      comment: order.description,
    };
    if (basketOrder.length > 0) merchantPaymInfo.basketOrder = basketOrder;
    if (order.customerEmail) merchantPaymInfo.customerEmails = [order.customerEmail];

    const res = await fetch(`${MONO_API}/api/merchant/invoice/create`, {
      method: "POST",
      headers: { "X-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountKopiyky,
        ccy: 980,
        merchantPaymInfo,
        redirectUrl: `${base}/checkout/success?order=${encodeURIComponent(order.number)}`,
        webHookUrl: `${base}/api/payment/callback`,
        validity: 3600,
        paymentType: "debit",
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

export async function fetchMonobankInvoiceStatus(
  invoiceId: string
): Promise<Record<string, unknown> | null> {
  const token = process.env.MONOBANK_TOKEN;
  if (!token) return null;

  const res = await fetch(
    `${MONO_API}/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`,
    { headers: { "X-Token": token }, cache: "no-store" }
  );
  if (!res.ok) return null;
  return (await res.json()) as Record<string, unknown>;
}

function parseModifiedAt(payload: Record<string, unknown>): Date {
  const raw = payload.modifiedDate;
  if (typeof raw === "string") {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

/**
 * Застосовує статус інвойсу Mono до замовлення.
 * Ігнорує застарілі вебхуки (менший modifiedDate) і не знижує вже оплачене замовлення.
 */
export async function applyMonobankInvoice(
  payload: Record<string, unknown>
): Promise<{ paymentStatus: string } | null> {
  const invoiceId = typeof payload.invoiceId === "string" ? payload.invoiceId : undefined;
  const orderNumber = extractMonobankOrderReference(payload);
  const status = typeof payload.status === "string" ? payload.status.toLowerCase() : "";
  const modifiedAt = parseModifiedAt(payload);

  const order = orderNumber
    ? await prisma.order.findUnique({ where: { number: orderNumber } })
    : invoiceId
      ? await prisma.order.findUnique({ where: { invoiceId } })
      : null;
  if (!order) return null;

  if (order.paymentModifiedAt && modifiedAt <= order.paymentModifiedAt) {
    return { paymentStatus: order.paymentStatus };
  }

  const data: {
    paymentModifiedAt: Date;
    invoiceId?: string;
    paymentStatus?: string;
    status?: "PAID";
  } = { paymentModifiedAt: modifiedAt };

  if (invoiceId && order.invoiceId !== invoiceId) data.invoiceId = invoiceId;

  if (order.paymentStatus === "paid") {
    await prisma.order.update({ where: { id: order.id }, data });
    return { paymentStatus: "paid" };
  }

  if (status === "success") {
    data.paymentStatus = "paid";
    if (order.status === "NEW") data.status = "PAID";
  } else if (status === "failure" || status === "failed") {
    data.paymentStatus = "failed";
  } else if (status === "expired") {
    data.paymentStatus = "expired";
  } else if (status === "processing" && order.paymentStatus === "pending") {
    data.paymentStatus = "processing";
  }

  await prisma.order.update({ where: { id: order.id }, data });
  return { paymentStatus: data.paymentStatus ?? order.paymentStatus };
}

/** Підтягнути актуальний статус з API Mono, якщо webhook ще не дійшов. */
export async function syncOrderPaymentFromMonobank(order: {
  id: string;
  invoiceId: string | null;
  paymentStatus: string;
}): Promise<string> {
  if (order.paymentStatus === "paid" || !order.invoiceId) return order.paymentStatus;
  const payload = await fetchMonobankInvoiceStatus(order.invoiceId);
  if (!payload) return order.paymentStatus;
  const applied = await applyMonobankInvoice(payload);
  return applied?.paymentStatus ?? order.paymentStatus;
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

/** Skip лише локально / preview. На Vercel Production завжди перевіряємо підпис. */
export function shouldSkipMonobankWebhookVerify(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.MONOBANK_SKIP_WEBHOOK_VERIFY === "1";
}
