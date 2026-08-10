import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const orders = await prisma.order.findMany({
    include: { items: true, user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}
