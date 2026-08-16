import { cookies, headers } from "next/headers";
import { randomUUID } from "crypto";
import type { NextResponse } from "next/server";
import { GUEST_COOKIE, GUEST_HEADER } from "@/lib/guest-constants";

export { GUEST_COOKIE, GUEST_HEADER };

const GUEST_MAX_AGE = 60 * 60 * 24 * 365; // 1 рік

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("380") && digits.length >= 12) return digits.slice(0, 12);
  if (digits.startsWith("0") && digits.length >= 10) return `380${digits.slice(1, 10)}`;
  if (digits.length === 9) return `380${digits}`;
  return digits;
}

/** Порівняння телефонів у замовленні з введенням користувача. */
export function phonesMatch(stored: string, input: string): boolean {
  const a = normalizePhone(stored);
  const b = normalizePhone(input);
  if (!a || !b) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}

export function readGuestId(): string | undefined {
  const fromCookie = cookies().get(GUEST_COOKIE)?.value;
  if (fromCookie) return fromCookie;
  // Same request where middleware first minted the cookie
  return headers().get(GUEST_HEADER) ?? undefined;
}

/** Читає guestId або створює новий (ще не пише в cookie — зробіть applyGuestCookie). */
export function getOrCreateGuestId(): { guestId: string; isNew: boolean } {
  const existing = readGuestId();
  if (existing) return { guestId: existing, isNew: !cookies().get(GUEST_COOKIE)?.value };
  return { guestId: randomUUID(), isNew: true };
}

export function applyGuestCookie(res: NextResponse, guestId: string) {
  res.cookies.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GUEST_MAX_AGE,
    path: "/",
  });
}

export { ORDER_STATUS_LABELS } from "@/lib/order-status";
