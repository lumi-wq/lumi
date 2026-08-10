import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const schema = z.object({
  name: z.string().max(60).optional(),
  newsletter: z.boolean().optional(),
  deliveryNotifications: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });
  return NextResponse.json({
    ok: true,
    user: {
      name: updated.name,
      newsletter: updated.newsletter,
      deliveryNotifications: updated.deliveryNotifications,
    },
  });
}
