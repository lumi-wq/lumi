import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірний email" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const code = String(Math.floor(1000 + Math.random() * 9000));
  await prisma.otpCode.deleteMany({ where: { email } });
  await prisma.otpCode.create({
    data: {
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendOtpEmail(email, code);

  // У розробці повертаємо код, щоб можна було увійти без пошти
  const devCode = process.env.NODE_ENV !== "production" ? code : undefined;
  return NextResponse.json({ ok: true, devCode });
}
