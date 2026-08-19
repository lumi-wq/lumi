import { Prisma, type PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export async function allocateProductSlug(db: Db, desired: string, excludeId?: string) {
  const base = desired.replace(/-+$/g, "").slice(0, 72) || `product-${Date.now()}`;
  for (let n = 0; n < 50; n++) {
    const slug = n === 0 ? base : `${base}-${n + 1}`;
    const existing = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
  }
  return `${base}-${Date.now()}`;
}

export function prismaErrorResponse(err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = err.meta?.target;
    const field = Array.isArray(target) ? String(target[0] ?? "") : "";
    const message =
      field === "slug"
        ? "Не вдалося підібрати унікальне посилання. Збережіть ще раз."
        : "Такий запис уже існує";
    return { error: message, status: 409 as const };
  }
  return { error: "Не вдалося зберегти товар", status: 500 as const };
}
