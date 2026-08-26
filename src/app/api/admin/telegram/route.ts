import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ensureTelegramWebhook, isTelegramConfigured, telegramChatIds } from "@/lib/telegram";
import { sendTelegramTestMessage } from "@/lib/order-telegram";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  await ensureTelegramWebhook();
  return NextResponse.json({
    configured: isTelegramConfigured(),
    hasToken: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
    chatCount: telegramChatIds().length,
  });
}

export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  try {
    await sendTelegramTestMessage();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Не вдалося надіслати";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
