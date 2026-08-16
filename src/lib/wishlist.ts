import { prisma } from "@/lib/prisma";
import { readGuestId } from "@/lib/guest";

export type WishlistOwner =
  | { kind: "user"; userId: string }
  | { kind: "guest"; guestId: string };

export function resolveWishlistOwner(userId?: string | null): WishlistOwner | null {
  if (userId) return { kind: "user", userId };
  const guestId = readGuestId();
  if (guestId) return { kind: "guest", guestId };
  return null;
}

export function wishlistWhere(owner: WishlistOwner) {
  return owner.kind === "user" ? { userId: owner.userId } : { guestId: owner.guestId };
}

export async function listWishlistItems(owner: WishlistOwner) {
  return prisma.wishlistItem.findMany({
    where: wishlistWhere(owner),
    include: {
      product: { include: { variants: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function isInWishlist(owner: WishlistOwner, productId: string) {
  const row = await prisma.wishlistItem.findFirst({
    where: { ...wishlistWhere(owner), productId },
    select: { id: true },
  });
  return Boolean(row);
}

/** Переносить гостьове обране в акаунт (без дублікатів). */
export async function claimGuestWishlist(userId: string) {
  const guestId = readGuestId();
  if (!guestId) return;

  const guestItems = await prisma.wishlistItem.findMany({
    where: { guestId },
    select: { id: true, productId: true },
  });
  if (guestItems.length === 0) return;

  const existing = await prisma.wishlistItem.findMany({
    where: { userId, productId: { in: guestItems.map((i) => i.productId) } },
    select: { productId: true },
  });
  const already = new Set(existing.map((e) => e.productId));

  const toClaim = guestItems.filter((i) => !already.has(i.productId));
  if (toClaim.length > 0) {
    await prisma.wishlistItem.updateMany({
      where: { id: { in: toClaim.map((i) => i.id) } },
      data: { userId, guestId: null },
    });
  }

  // Дублікати (вже були в профілі) — прибираємо гостьові
  const dupIds = guestItems.filter((i) => already.has(i.productId)).map((i) => i.id);
  if (dupIds.length > 0) {
    await prisma.wishlistItem.deleteMany({ where: { id: { in: dupIds } } });
  }
}
