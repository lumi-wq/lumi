import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      discountPercent: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}
