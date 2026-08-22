import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getMerchantConfig } from "@/lib/merchant/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Заборонено" }, { status: 403 });
  }
  const config = getMerchantConfig();
  if (!config) {
    return NextResponse.json({ configured: false });
  }
  return NextResponse.json({
    configured: true,
    accountId: config.accountId,
    dataSourceId: config.dataSourceId,
    feedLabel: config.feedLabel,
    contentLanguage: config.contentLanguage,
  });
}
