import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { readGuestId } from "@/lib/guest";
import { claimGuestWishlist } from "@/lib/wishlist";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(4),
});

/**
 * Привʼязує гостьові замовлення до акаунта:
 * — за guestId cookie (історія з цього пристрою)
 * — за тим самим email (замовлення з інших пристроїв з цим email)
 */
async function claimGuestOrders(userId: string, email: string) {
  const guestId = readGuestId();
  const or: Array<{ guestId?: string; email?: string }> = [{ email }];
  if (guestId) or.push({ guestId });

  await prisma.order.updateMany({
    where: {
      userId: null,
      OR: or,
    },
    data: { userId },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const otp = await prisma.otpCode.findFirst({
    where: {
      email,
      code: parsed.data.code,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!otp) {
    return NextResponse.json({ error: "Невірний або прострочений код" }, { status: 401 });
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  await claimGuestOrders(user.id, email);
  await claimGuestWishlist(user.id);

  const token = await createSessionToken(user.id);
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
