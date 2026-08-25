import { NextResponse } from "next/server";
import {
  applyMonobankInvoice,
  shouldSkipMonobankWebhookVerify,
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
    const xSign = req.headers.get("x-sign") ?? req.headers.get("X-Sign");

    if (!shouldSkipMonobankWebhookVerify()) {
      const ok = await verifyMonobankWebhookSignature(rawBody, xSign);
      if (!ok) {
        console.error("[monobank] webhook invalid signature");
        return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
      }
    }

    const json = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
    const applied = await applyMonobankInvoice(json);
    if (!applied) {
      console.error("[monobank] webhook order not found", typeof json.status === "string" ? json.status : "");
    }

    // Monobank очікує 200 OK, інакше до 3 повторів
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
