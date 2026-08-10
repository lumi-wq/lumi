import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ code: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірний запит" }, { status: 400 });
  }
  const promo = await prisma.promoCode.findUnique({
    where: { code: parsed.data.code.toUpperCase() },
  });
  if (!promo || !promo.active) {
    return NextResponse.json({ error: "Промокод недійсний" }, { status: 404 });
  }
  return NextResponse.json({ code: promo.code, discountPercent: promo.discountPercent });
}
