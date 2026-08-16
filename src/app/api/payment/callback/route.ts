import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  extractMonobankOrderReference,
  isMonobankPaymentSuccess,
  verifyMonobankWebhookSignature,
} from "@/lib/payments";

/**
 * Webhook від plata by mono / Monobank Acquiring (webHookUrl).
 * Тіло = статус інвойсу; підпис у заголовку X-Sign.
 * @see https://monobank.ua/api-docs/acquiring/dev/webhooks/verify
 */
export async function POST(req: Request) {
  try {
    const rawBody = Buffer.from(await req.arrayBuffer());
    const xSign =
      req.headers.get("x-sign") ?? req.headers.get("X-Sign");

    // У production обовʼязково перевіряємо підпис.
    // Для локальних тестів можна MONOBANK_SKIP_WEBHOOK_VERIFY=1 (лише з тестовим токеном).
    const skipVerify = process.env.MONOBANK_SKIP_WEBHOOK_VERIFY === "1";
    if (!skipVerify) {
      const ok = await verifyMonobankWebhookSignature(rawBody, xSign);
      if (!ok) {
        return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
      }
    }

    const json = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
    const orderNumber = extractMonobankOrderReference(json);
    const status = typeof json.status === "string" ? json.status : undefined;

    if (orderNumber && isMonobankPaymentSuccess(status)) {
      await prisma.order.updateMany({
        where: { number: orderNumber },
        data: { paymentStatus: "paid", status: "PAID" },
      });
    }

    // Monobank очікує 200 OK, інакше до 3 повторів
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
