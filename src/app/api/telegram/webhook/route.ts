import { NextResponse } from "next/server";
import {
  isTelegramWebhookAuthorized,
  sendTelegramMessage,
  telegramChatIds,
} from "@/lib/telegram";

type TelegramChat = { id?: number; type?: string };
type TelegramUpdate = {
  message?: { chat?: TelegramChat; text?: string };
  my_chat_member?: {
    chat?: TelegramChat;
    new_chat_member?: { status?: string };
  };
};

function chatIdFromUpdate(update: TelegramUpdate | null): number | undefined {
  return update?.message?.chat?.id ?? update?.my_chat_member?.chat?.id;
}

function shouldReply(update: TelegramUpdate | null): boolean {
  const text = update?.message?.text?.trim() ?? "";
  if (/^\/(start|chatid)(?:@\S+)?(?:\s|$)/i.test(text)) return true;

  const status = update?.my_chat_member?.new_chat_member?.status;
  return status === "member" || status === "administrator";
}

function chatIdReply(id: string): string {
  if (telegramChatIds().includes(id)) {
    return "✅ Цей чат уже підключено. Сповіщення про оплачені замовлення LUMI приходитимуть сюди.";
  }
  return [
    "Ваш chat ID:",
    `<code>${id}</code>`,
    "",
    "Додайте в Vercel (Production):",
    `<code>TELEGRAM_CHAT_ID=${id}</code>`,
    "",
    "Для групи зробіть бота адміністратором. Після redeploy сповіщення приходитимуть сюди.",
  ].join("\n");
}

/**
 * Вхідні повідомлення бота. /start або додавання в групу підказує chat ID.
 */
export async function POST(req: Request) {
  if (!isTelegramWebhookAuthorized(req.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  const chatId = chatIdFromUpdate(update);
  if (chatId == null || !shouldReply(update)) return NextResponse.json({ ok: true });

  try {
    await sendTelegramMessage(chatIdReply(String(chatId)), {
      chatId: String(chatId),
      disableNotification: true,
    });
  } catch (err) {
    console.error("[telegram] webhook reply", err);
  }

  return NextResponse.json({ ok: true });
}
