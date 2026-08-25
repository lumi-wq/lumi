import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ProductDetailPage } from "@/components/product/ProductDetailPage";
import { NOINDEX } from "@/lib/seo";
import { TEST_PAYMENT_SLUG } from "@/lib/test-payment";

export const dynamic = "force-dynamic";
export const metadata = { title: "Тестова оплата", ...NOINDEX };

export default async function TestPaymentProductPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();
  return <ProductDetailPage slug={TEST_PAYMENT_SLUG} />;
}
