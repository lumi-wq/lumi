import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { readGuestId } from "@/lib/guest";

export async function GET() {
  const user = await getSessionUser();
  const guestId = readGuestId();

  const orders =
    guestId || user
      ? await prisma.order.findMany({
          where: user
            ? guestId
              ? { OR: [{ guestId }, { userId: user.id }] }
              : { userId: user.id }
            : { guestId: guestId! },
          include: { items: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : [];

  const seen = new Set<string>();
  const recent = orders
    .filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    })
    .map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      itemsCount: o.items.reduce((s, i) => s + i.quantity, 0),
    }));

  return NextResponse.json({ recent });
}
