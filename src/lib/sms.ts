import { normalizePhone } from "@/lib/guest";

const SMS_CLUB_SEND_URL = "https://im.smsclub.mobi/sms/send";

export function smsRecipient(phone: string): string | null {
  const digits = normalizePhone(phone);
  if (/^380\d{9}$/.test(digits)) return digits;
  return null;
}

export function isSmsClubConfigured(): boolean {
  return Boolean(process.env.SMSCLUB_TOKEN?.trim() && process.env.SMS_SENDER?.trim());
}

type SmsClubSendResponse = {
  success_request?: {
    info?: Record<string, string>;
    add_info?: Record<string, string>;
  };
};

export async function sendSms(phone: string, text: string): Promise<void> {
  const to = smsRecipient(phone);
  if (!to) {
    console.error("[sms] skip: invalid phone");
    return;
  }

  const token = process.env.SMSCLUB_TOKEN?.trim();
  const sender = process.env.SMS_SENDER?.trim();
  if (!token || !sender) {
    console.log(`\n[LUMI SMS] → ${to}\n${text}\n`);
    return;
  }

  const res = await fetch(SMS_CLUB_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: [to],
      message: text,
      src_addr: sender,
    }),
  });

  const json = (await res.json().catch(() => null)) as SmsClubSendResponse | null;
  const info = json?.success_request?.info;
  if (!res.ok || !info || Object.keys(info).length === 0) {
    const detail = json?.success_request?.add_info ?? json;
    throw new Error(`SMS Club: ${res.status} ${JSON.stringify(detail)}`);
  }
}
