import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Оформлення замовлення",
  ...NOINDEX,
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
