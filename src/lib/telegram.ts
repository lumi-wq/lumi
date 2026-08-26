import { getSiteUrl } from "@/lib/site";

const TELEGRAM_API = "https://api.telegram.org";

export function telegramBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
}

export function telegramChatIds(): string[] {
  return (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isTelegramConfigured(): boolean {
  return Boolean(telegramBotToken() && telegramChatIds().length > 0);
}

type TelegramApiResult = {
  ok: boolean;
  description?: string;
};

async function telegramApi(method: string, body: Record<string, unknown>): Promise<TelegramApiResult> {
  const token = telegramBotToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не налаштований");

  const res = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as TelegramApiResult | null;
  if (!res.ok || !json?.ok) {
    throw new Error(`Telegram ${method}: ${res.status} ${json?.description ?? ""}`.trim());
  }
  return json;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendTelegramMessage(
  text: string,
  options?: { chatId?: string; disableNotification?: boolean }
): Promise<void> {
  const ids = options?.chatId ? [options.chatId] : telegramChatIds();
  if (ids.length === 0) return;

  await Promise.all(
    ids.map((chat_id) =>
      telegramApi("sendMessage", {
        chat_id,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: options?.disableNotification ?? false,
      })
    )
  );
}

export type TelegramPhoto = {
  url: string;
  caption?: string;
};

/** 1 фото — sendPhoto; 2–10 — альбом. Більше 10 ріжемо на пачки. */
export async function sendTelegramPhotos(photos: TelegramPhoto[], chatIds = telegramChatIds()): Promise<void> {
  if (photos.length === 0 || chatIds.length === 0) return;

  for (const chat_id of chatIds) {
    for (let i = 0; i < photos.length; i += 10) {
      const chunk = photos.slice(i, i + 10);
      if (chunk.length === 1) {
        await telegramApi("sendPhoto", {
          chat_id,
          photo: chunk[0].url,
          ...(chunk[0].caption
            ? { caption: chunk[0].caption, parse_mode: "HTML" }
            : {}),
        });
        continue;
      }
      await telegramApi("sendMediaGroup", {
        chat_id,
        media: chunk.map((photo) => ({
          type: "photo",
          media: photo.url,
          ...(photo.caption ? { caption: photo.caption, parse_mode: "HTML" } : {}),
        })),
      });
    }
  }
}

export async function setTelegramWebhook(url: string): Promise<void> {
  await telegramApi("setWebhook", {
    url,
    allowed_updates: ["message", "my_chat_member"],
    secret_token: telegramWebhookSecret(),
  });
}

export function telegramWebhookSecret(): string {
  const token = telegramBotToken();
  if (!token) return "";
  // Telegram secret_token: 1–256 chars A-Z, a-z, 0-9, _, -
  return token.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64) || "lumi";
}

export function isTelegramWebhookAuthorized(header: string | null): boolean {
  const expected = telegramWebhookSecret();
  return Boolean(expected && header && header === expected);
}

let webhookAttempted = false;

/** Реєструє webhook, щоб /start відповів chat ID. Локальний localhost пропускаємо. */
export async function ensureTelegramWebhook(): Promise<void> {
  if (webhookAttempted || !telegramBotToken()) return;
  webhookAttempted = true;
  const base = getSiteUrl();
  if (/localhost|127\.0\.0\.1/i.test(base)) return;
  try {
    await setTelegramWebhook(`${base}/api/telegram/webhook`);
  } catch (err) {
    console.error("[telegram] setWebhook", err);
  }
}
