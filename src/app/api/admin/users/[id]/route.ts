import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({ discountPercent: z.number().int().min(0).max(50) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id: params.id },
    data: { discountPercent: parsed.data.discountPercent },
  });
  return NextResponse.json({ user: { id: user.id, discountPercent: user.discountPercent } });
}
