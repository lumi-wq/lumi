import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(4),
});

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
