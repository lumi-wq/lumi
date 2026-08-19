"use client";

import Link from "next/link";
import { trackSelectContent } from "@/lib/ga";

export function RelatedLandings({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <nav className="mt-8" aria-label="Схожі розділи">
      <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/40">
        Дивіться також
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => trackSelectContent("category", item.href)}
              className="inline-flex rounded-lg border border-[#E0E0E0] bg-white px-3 py-1.5 text-[13px] font-medium text-obsidian transition hover:border-cobalt hover:text-cobalt"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
