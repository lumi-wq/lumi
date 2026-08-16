import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { applyGuestCookie, getOrCreateGuestId } from "@/lib/guest";
import {
  listWishlistItems,
  resolveWishlistOwner,
  wishlistWhere,
} from "@/lib/wishlist";

function mapItems(
  items: Awaited<ReturnType<typeof listWishlistItems>>
) {
  return items.map((i) => ({
    id: i.id,
    productId: i.productId,
    slug: i.product.slug,
    name: i.product.name,
    price: i.product.price,
    image: i.product.images[0] ?? "",
  }));
}

export async function GET() {
  const user = await getSessionUser();
  const owner = resolveWishlistOwner(user?.id);
  if (!owner) return NextResponse.json({ items: [] });

  const items = await listWishlistItems(owner);
  return NextResponse.json({ items: mapItems(items) });
}

const schema = z.object({ productId: z.string().min(1) });

/** Перемикає товар в обраному (акаунт або гість за cookie). */
export async function POST(req: Request) {
  const user = await getSessionUser();
  let owner = resolveWishlistOwner(user?.id);
  let newGuestId: string | null = null;

  if (!owner) {
    const { guestId, isNew } = getOrCreateGuestId();
    owner = { kind: "guest", guestId };
    if (isNew) newGuestId = guestId;
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Товар не знайдено" }, { status: 404 });
  }

  const existing = await prisma.wishlistItem.findFirst({
    where: { ...wishlistWhere(owner), productId: product.id },
  });

  let added: boolean;
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    added = false;
  } else {
    await prisma.wishlistItem.create({
      data:
        owner.kind === "user"
          ? { userId: owner.userId, productId: product.id }
          : { guestId: owner.guestId, productId: product.id },
    });
    added = true;
  }

  const res = NextResponse.json({ added });
  if (newGuestId) applyGuestCookie(res, newGuestId);
  return res;
}
