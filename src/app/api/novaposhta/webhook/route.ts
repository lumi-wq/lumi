import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapNpStatusCode } from "@/lib/novaposhta";

/**
 * Вебхук статусів відправлень Нової Пошти (UA).
 * URL для кабінету: https://lumi.kids/api/novaposhta/webhook
 *
 * Очікувані формати тіла (НП може надсилати кілька варіантів):
 * 1) { number, history_tracking: [{ code, code_name, ... }] }
 * 2) { DocumentNumber / Number, StatusCode, Status }
 * 3) масив таких об'єктів
 */
export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    if (!raw) return NextResponse.json({ ok: false, error: "empty body" }, { status: 400 });

    const payloads = Array.isArray(raw) ? raw : [raw];
    const results: { number: string; status: string | null }[] = [];

    for (const item of payloads) {
      const number: string | undefined =
        item.number ?? item.Number ?? item.DocumentNumber ?? item.documentNumber;
      if (!number) continue;

      const history = item.history_tracking ?? item.historyTracking ?? [];
      const latest = Array.isArray(history) && history.length > 0 ? history[history.length - 1] : null;

      const statusCode = String(
        latest?.code ?? item.StatusCode ?? item.statusCode ?? item.Code ?? ""
      );
      const statusText: string =
        latest?.code_name ?? item.Status ?? item.status ?? item.StatusName ?? "";

      const lumiStatus = statusCode ? mapNpStatusCode(statusCode) : null;

      const order = await prisma.order.findFirst({
        where: { trackingNumber: number },
      });
      if (!order) {
        results.push({ number, status: null });
        continue;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          npStatusCode: statusCode || order.npStatusCode,
          npStatusText: statusText || order.npStatusText,
          ...(lumiStatus ? { status: lumiStatus } : {}),
        },
      });
      results.push({ number, status: lumiStatus });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[NP webhook]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

/** Health-check для налаштування вебхука в кабінеті НП. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "LUMI Nova Poshta webhook",
    url: "https://lumi.kids/api/novaposhta/webhook",
  });
}
