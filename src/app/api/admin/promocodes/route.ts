import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ promoCodes });
}

const schema = z.object({
  code: z.string().min(2).max(30),
  discountPercent: z.number().int().min(1).max(90),
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }
  const promo = await prisma.promoCode.create({
    data: { code: parsed.data.code.toUpperCase(), discountPercent: parsed.data.discountPercent },
  });
  return NextResponse.json({ promo }, { status: 201 });
}
