import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const ORDER_ACCESS_COOKIE = "lumi_order_access";
const MAX_ORDERS = 30;
const MAX_AGE = 60 * 60 * 24 * 90; // 90 днів

export function normalizeOrderNumber(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("LUMI-")) return trimmed;
  return `LUMI-${trimmed.replace(/^LUMI-?/i, "")}`;
}

function parseAccessList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((n) => n.trim().toUpperCase())
    .filter(Boolean);
}

export function readOrderAccessList(): string[] {
  return parseAccessList(cookies().get(ORDER_ACCESS_COOKIE)?.value);
}

export function hasOrderAccess(number: string): boolean {
  const normalized = normalizeOrderNumber(number);
  return readOrderAccessList().includes(normalized);
}

/** Додає номер до cookie доступу (після перевірки телефоном). */
export function grantOrderAccess(res: NextResponse, number: string) {
  const normalized = normalizeOrderNumber(number);
  const next = [normalized, ...readOrderAccessList().filter((n) => n !== normalized)].slice(
    0,
    MAX_ORDERS
  );
  res.cookies.set(ORDER_ACCESS_COOKIE, next.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}
