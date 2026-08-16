import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Вхід",
  ...NOINDEX,
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
