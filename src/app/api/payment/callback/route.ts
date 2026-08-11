import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook від Monobank Acquiring (webHookUrl).
 * Позначає замовлення оплаченим лише при успішному статусі.
 */
export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const orderNumber =
      typeof json.reference === "string"
        ? json.reference
        : typeof json.order_id === "string"
          ? json.order_id
          : undefined;

    const status = typeof json.status === "string" ? json.status.toLowerCase() : "";
    const success =
      !status || status === "success" || status === "processed" || status === "paid";

    if (orderNumber && success) {
      await prisma.order.updateMany({
        where: { number: orderNumber },
        data: { paymentStatus: "paid", status: "PAID" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
