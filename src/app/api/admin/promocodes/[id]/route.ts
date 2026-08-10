import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  active: z.boolean().optional(),
  discountPercent: z.number().int().min(1).max(90).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }
  const promo = await prisma.promoCode.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ promo });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  await prisma.promoCode.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
