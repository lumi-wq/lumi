"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart, cartCount } from "@/store/cart";
import { Logo } from "./Logo";
import { SearchIcon, UserIcon, HeartIcon, BagIcon } from "@/components/Icons";
import { TrackedLink } from "@/components/analytics/TrackedLink";

const NAV_LINKS = [
  { href: "/category/sale", label: "Розпродаж" },
  { href: "/category/new", label: "Новинки" },
  { href: "/category/girls", label: "Дівчатка" },
  { href: "/category/boys", label: "Хлопчики" },
  { href: "/category/accessories", label: "Аксесуари" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(items) : 0;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-obsidian py-2 text-center text-xs font-semibold uppercase tracking-wide text-white">
        Доставка Новою Поштою по Україні
      </div>
      <div className="border-b border-black/5 bg-white">
        <div className="container-content flex h-20 items-center justify-between gap-4">
          <Logo />
          <nav className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <TrackedLink
                  key={link.href}
                  href={link.href}
                  contentType="category"
                  contentId={link.href.replace("/category/", "")}
                  className={`relative text-[15px] font-medium transition hover:text-cobalt ${
                    active ? "text-cobalt" : "text-obsidian"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-2 left-0 h-1 w-1 rounded-full bg-cobalt" />
                  )}
                </TrackedLink>
              );
            })}
          </nav>
          <div className="flex items-center gap-5">
            <form
              onSubmit={submitSearch}
              className="hidden items-center gap-2.5 rounded-full border border-[#E0E0E0] px-3.5 py-2 lg:flex"
            >
              <SearchIcon className="h-4 w-4 text-[#999]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пошук..."
                className="w-32 bg-transparent text-sm outline-none placeholder:text-[#999]"
                aria-label="Пошук товарів"
              />
            </form>
            <Link href="/search" className="text-obsidian transition hover:text-cobalt lg:hidden" aria-label="Пошук">
              <SearchIcon className="h-[22px] w-[22px]" />
            </Link>
            <Link href="/profile" className="text-obsidian transition hover:text-cobalt" aria-label="Профіль">
              <UserIcon />
            </Link>
            <Link
              href="/wishlist"
              className="hidden text-obsidian transition hover:text-cobalt sm:block"
              aria-label="Обране"
            >
              <HeartIcon />
            </Link>
            <Link href="/cart" className="relative text-obsidian transition hover:text-cobalt" aria-label="Кошик">
              <BagIcon />
              {count > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cobalt px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
