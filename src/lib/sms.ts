import { normalizePhone } from "@/lib/guest";

const TURBOSMS_SEND_URL = "https://api.turbosms.ua/message/send.json";

export function smsRecipient(phone: string): string | null {
  const digits = normalizePhone(phone);
  if (/^380\d{9}$/.test(digits)) return digits;
  return null;
}

export function isSmsConfigured(): boolean {
  return Boolean(process.env.TURBOSMS_TOKEN?.trim());
}

type TurboSmsSendResponse = {
  response_code?: number;
  response_status?: string;
  response_result?: Array<{
    phone?: string;
    message_id?: string | null;
    response_code?: number;
    response_status?: string;
  }> | null;
};

export async function sendSms(phone: string, text: string): Promise<void> {
  const to = smsRecipient(phone);
  if (!to) {
    console.error("[sms] skip: invalid phone");
    return;
  }

  const token = process.env.TURBOSMS_TOKEN?.trim();
  const sender = (process.env.TURBOSMS_SENDER ?? "TurboSMS").trim();
  if (!token) {
    console.log(`[sms] mock → …${to.slice(-4)}`);
    return;
  }

  const res = await fetch(TURBOSMS_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipients: [to],
      sms: {
        sender,
        text,
      },
    }),
  });

  const json = (await res.json().catch(() => null)) as TurboSmsSendResponse | null;
  const row = Array.isArray(json?.response_result) ? json.response_result[0] : null;
  if (!res.ok || json?.response_code !== 0 || !row?.message_id) {
    throw new Error(
      `TurboSMS: ${res.status} ${json?.response_status ?? ""} ${row?.response_status ?? ""}`.trim()
    );
  }
  console.log("[sms] sent via TurboSMS");
}
