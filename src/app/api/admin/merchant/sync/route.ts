import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { MerchantApiError } from "@/lib/merchant/client";
import { listCatalogProductIds, syncProductToMerchant } from "@/lib/merchant/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  productId: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
  }

  try {
    if (parsed.data.productId) {
      const result = await syncProductToMerchant(parsed.data.productId);
      return NextResponse.json({ result });
    }

    const ids = await listCatalogProductIds();
    const results = [];
    for (const productId of ids) {
      results.push(await syncProductToMerchant(productId));
    }
    return NextResponse.json({
      results,
      inserted: results.reduce((n, r) => n + r.inserted, 0),
      failed: results.reduce((n, r) => n + r.failed, 0),
    });
  } catch (err) {
    console.error("[admin/merchant/sync]", err);
    const status = err instanceof MerchantApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Помилка синхронізації";
    return NextResponse.json({ error: message }, { status: status >= 400 ? status : 500 });
  }
}
