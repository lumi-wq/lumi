import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { normalizePhone } from "@/lib/guest";
import { getSiteUrl } from "@/lib/site";
import { normalizeHex } from "@/lib/color";
import {
  escapeHtml,
  ensureTelegramWebhook,
  isTelegramConfigured,
  sendTelegramMessage,
  sendTelegramPhotos,
} from "@/lib/telegram";

function formatUaPhone(phone: string): string {
  const digits = normalizePhone(phone);
  if (/^380\d{9}$/.test(digits)) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return phone.trim();
}

function publicImageUrl(path: string): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = getSiteUrl();
  if (/localhost|127\.0\.0\.1/i.test(base)) return null;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

function colorLabel(name: string | undefined, hex: string): string {
  const prettyHex = (normalizeHex(hex) ?? hex).toUpperCase();
  const prettyName = name?.trim();
  if (prettyName && prettyName.toUpperCase() !== prettyHex) {
    return `${prettyName} (${prettyHex})`;
  }
  return prettyHex || hex;
}

type PackedItem = {
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string | null;
};

export function shopOrderPaidHtml(order: {
  number: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  city: string;
  warehouse: string;
  subtotal: number;
  shipping: number;
  total: number;
  items: PackedItem[];
}): string {
  const lines = order.items.map((item, index) => {
    const qty = item.quantity > 1 ? ` × ${item.quantity}` : "";
    return `${index + 1}. <b>${escapeHtml(item.name)}</b>\n    ${escapeHtml(item.color)} · ${escapeHtml(item.size)}${qty}\n    ${escapeHtml(formatPrice(item.price * item.quantity))}`;
  });

  const email = order.email?.trim();
  const parts = [
    `🛒 Оплачене замовлення <code>${escapeHtml(order.number)}</code>`,
    "",
    "<b>Зібрати</b>",
    ...lines,
    "",
    "<b>Відправити Новою Поштою</b>",
    escapeHtml(`${order.firstName} ${order.lastName}`.trim()),
    `<code>${escapeHtml(formatUaPhone(order.phone))}</code>`,
    email ? escapeHtml(email) : null,
    escapeHtml(order.city),
    escapeHtml(order.warehouse),
    "",
    `<b>Сума:</b> ${escapeHtml(formatPrice(order.total))}`,
    `товари ${escapeHtml(formatPrice(order.subtotal))} + доставка ${escapeHtml(formatPrice(order.shipping))}`,
    "",
    `<a href="${escapeHtml(`${getSiteUrl()}/admin/orders`)}">Відкрити в адмінці</a>`,
  ];

  return parts.filter((line) => line != null).join("\n");
}

async function loadPackedOrder(number: string) {
  const order = await prisma.order.findUnique({
    where: { number },
    include: { items: true },
  });
  if (!order) return null;

  const productIds = [...new Set(order.items.map((item) => item.productId))];
  const colors =
    productIds.length === 0
      ? []
      : await prisma.productColor.findMany({
          where: { productId: { in: productIds } },
          select: { productId: true, colorHex: true, name: true },
        });
  const colorByKey = new Map(
    colors.map((c) => {
      const hex = (normalizeHex(c.colorHex) ?? c.colorHex).toUpperCase();
      return [`${c.productId}:${hex}`, c.name] as const;
    })
  );

  return {
    number: order.number,
    firstName: order.firstName,
    lastName: order.lastName,
    phone: order.phone,
    email: order.email,
    city: order.city,
    warehouse: order.warehouse,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    items: order.items.map((item) => {
      const hex = (normalizeHex(item.color) ?? item.color).toUpperCase();
      return {
        name: item.name,
        size: item.size,
        color: colorLabel(colorByKey.get(`${item.productId}:${hex}`), item.color),
        quantity: item.quantity,
        price: item.price,
        image: publicImageUrl(item.image),
      };
    }),
  };
}

/** Сповіщення власнику магазину. Помилка не валить checkout. */
export async function notifyShopOrderPaid(orderNumber: string): Promise<void> {
  if (!isTelegramConfigured()) {
    console.log("[telegram] skip: not configured", orderNumber);
    return;
  }

  try {
    await ensureTelegramWebhook();
    const order = await loadPackedOrder(orderNumber);
    if (!order) {
      console.error("[telegram] order not found", orderNumber);
      return;
    }

    await sendTelegramMessage(shopOrderPaidHtml(order));

    const photos = order.items
      .filter((item) => item.image)
      .map((item) => ({
        url: item.image as string,
        caption: `<b>${escapeHtml(item.name)}</b>\n${escapeHtml(item.color)} · ${escapeHtml(item.size)}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`,
      }));
    if (photos.length > 0) {
      try {
        await sendTelegramPhotos(photos);
      } catch (err) {
        console.error("[telegram] photos", orderNumber, err);
      }
    }

    console.log("[telegram] order paid ok", orderNumber);
  } catch (err) {
    console.error("[telegram] order paid", orderNumber, err);
  }
}

export async function sendTelegramTestMessage(): Promise<void> {
  if (!isTelegramConfigured()) {
    throw new Error("Додайте TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID у змінні середовища");
  }
  await ensureTelegramWebhook();
  await sendTelegramMessage(
    [
      "✅ Telegram для LUMI підключено.",
      "",
      "Коли замовлення буде <b>оплачене</b>, сюди прийде повідомлення зі складом, отримувачем і відділенням Нової Пошти.",
    ].join("\n")
  );
}
