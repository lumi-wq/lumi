import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getTrackingStatus } from "@/lib/novaposhta";

const schema = z.object({
  status: z
    .enum(["NEW", "PAID", "PROCESSING", "SHIPPED", "ARRIVED", "DELIVERED", "CANCELLED"])
    .optional(),
  trackingNumber: z.string().trim().min(5).max(40).nullable().optional(),
  syncTracking: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }

  const data: {
    status?: "NEW" | "PAID" | "PROCESSING" | "SHIPPED" | "ARRIVED" | "DELIVERED" | "CANCELLED";
    trackingNumber?: string | null;
    npStatusCode?: string | null;
    npStatusText?: string | null;
  } = {};

  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.trackingNumber !== undefined) {
    data.trackingNumber = parsed.data.trackingNumber
      ? parsed.data.trackingNumber.replace(/\s+/g, "")
      : null;
  }

  // Опційно підтягнути актуальний статус з НП за ТТН
  const trackingToSync =
    parsed.data.syncTracking === true
      ? data.trackingNumber ??
        (await prisma.order.findUnique({ where: { id: params.id } }))?.trackingNumber
      : null;

  if (trackingToSync) {
    try {
      const info = await getTrackingStatus(trackingToSync);
      if (info) {
        data.npStatusCode = info.statusCode;
        data.npStatusText = info.status;
        if (info.lumiStatus) data.status = info.lumiStatus;
      }
    } catch (err) {
      console.warn("[NP track]", err);
    }
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json({ order });
}
