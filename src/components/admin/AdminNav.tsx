"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Огляд" },
  { href: "/admin/products", label: "Товари" },
  { href: "/admin/orders", label: "Замовлення" },
  { href: "/product/test-oplata", label: "Тест оплати 1 ₴" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-6 space-y-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              active ? "bg-cobalt text-white" : "hover:bg-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
