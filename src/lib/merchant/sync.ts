import { prisma } from "@/lib/prisma";
import { isMerchantConfigured } from "./config";
import {
  deleteProductInput,
  insertProductInput,
  listMerchantOfferIds,
  clearOfferListCache,
  MerchantApiError,
} from "./client";
import {
  mapProductToInputs,
  offerIdPrefix,
  type MerchantProductSource,
} from "./map-product";
import { isTestPaymentSlug, TEST_PAYMENT_SLUG } from "@/lib/test-payment";

const merchantInclude = {
  colors: { orderBy: { sortOrder: "asc" as const } },
  variants: true,
  productType: { select: { slug: true, name: true, unisex: true } },
} as const;

export type MerchantSyncItemResult = {
  offerId: string;
  ok: boolean;
  error?: string;
};

export type MerchantSyncResult = {
  productId: string;
  name: string;
  inserted: number;
  deleted: number;
  failed: number;
  items: MerchantSyncItemResult[];
};

async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  const n = Math.min(Math.max(1, limit), items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

async function loadProduct(productId: string): Promise<MerchantProductSource | null> {
  return prisma.product.findUnique({
    where: { id: productId },
    include: merchantInclude,
  });
}

export async function syncProductToMerchant(productId: string): Promise<MerchantSyncResult> {
  if (!isMerchantConfigured()) {
    throw new MerchantApiError("Merchant API не налаштовано", 503);
  }
  const product = await loadProduct(productId);
  if (!product) {
    throw new MerchantApiError("Товар не знайдено", 404);
  }
  if (isTestPaymentSlug(product.slug)) {
    const deleted = await removeProductFromMerchant(productId);
    return { productId, name: product.name, inserted: 0, deleted, failed: 0, items: [] };
  }

  const inputs = await mapProductToInputs(product);
  const keep = new Set(inputs.map((i) => i.offerId));
  const items = await pool(inputs, 4, async (input): Promise<MerchantSyncItemResult> => {
    try {
      await insertProductInput(input);
      return { offerId: input.offerId, ok: true };
    } catch (err) {
      return {
        offerId: input.offerId,
        ok: false,
        error: err instanceof Error ? err.message : "Помилка вставки",
      };
    }
  });

  let deleted = 0;
  try {
    const prefix = offerIdPrefix(product.id);
    const existing = await listMerchantOfferIds();
    const stale = existing.filter((id) => id.startsWith(prefix) && !keep.has(id));
    await pool(stale, 4, async (offerId) => {
      await deleteProductInput(offerId);
    });
    deleted = stale.length;
    if (stale.length) clearOfferListCache();
  } catch (err) {
    console.error("[merchant] orphan cleanup", err);
  }

  return {
    productId: product.id,
    name: product.name,
    inserted: items.filter((i) => i.ok).length,
    deleted,
    failed: items.filter((i) => !i.ok).length,
    items,
  };
}

export async function removeProductFromMerchant(productId: string): Promise<number> {
  if (!isMerchantConfigured()) return 0;
  const prefix = offerIdPrefix(productId);
  const existing = await listMerchantOfferIds();
  const stale = existing.filter((id) => id.startsWith(prefix));
  await pool(stale, 4, async (offerId) => {
    await deleteProductInput(offerId);
  });
  if (stale.length) clearOfferListCache();
  return stale.length;
}

export async function listCatalogProductIds(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { slug: { not: TEST_PAYMENT_SLUG } },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.id);
}

export async function syncProductToMerchantQuiet(productId: string) {
  if (!isMerchantConfigured()) return;
  try {
    await syncProductToMerchant(productId);
  } catch (err) {
    console.error("[merchant] auto-sync", productId, err);
  }
}

export async function removeProductFromMerchantQuiet(productId: string) {
  if (!isMerchantConfigured()) return;
  try {
    await removeProductFromMerchant(productId);
  } catch (err) {
    console.error("[merchant] auto-remove", productId, err);
  }
}
