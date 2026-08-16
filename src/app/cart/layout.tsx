import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Кошик",
  ...NOINDEX,
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
