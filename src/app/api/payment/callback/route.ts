import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook від платіжних систем (LiqPay server_url / Monobank webHookUrl).
 * Спрощена обробка: позначає замовлення оплаченим за номером.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let orderNumber: string | undefined;

    if (contentType.includes("application/json")) {
      const json = await req.json();
      orderNumber = json.reference ?? json.order_id;
    } else {
      const form = await req.formData();
      const data = form.get("data");
      if (typeof data === "string") {
        const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
        orderNumber = decoded.order_id;
      }
    }

    if (orderNumber) {
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
