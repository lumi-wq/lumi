import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { syncOrderPaymentFromMonobank } from "@/lib/payments";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });

  const pendingCard = await prisma.order.findMany({
    where: {
      invoiceId: { not: null },
      paymentStatus: { in: ["pending", "processing"] },
    },
    select: { id: true, invoiceId: true, paymentStatus: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  await Promise.all(pendingCard.map((order) => syncOrderPaymentFromMonobank(order)));

  const orders = await prisma.order.findMany({
    include: { items: true, user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}
