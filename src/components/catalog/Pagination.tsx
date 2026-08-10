"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/Icons";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const next = new URLSearchParams(params.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <nav
      className="mt-12 flex items-center justify-between rounded-card border border-black/5 bg-white px-5 py-3"
      aria-label="Пагінація"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide hover:text-cobalt"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Назад
        </Link>
      ) : (
        <span className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-obsidian/30">
          <ArrowLeftIcon className="h-4 w-4" /> Назад
        </span>
      )}

      <div className="flex gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Link
            key={p}
            href={hrefFor(p)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
              p === page ? "bg-cobalt text-white" : "hover:bg-chalk"
            }`}
          >
            {p}
          </Link>
        ))}
      </div>

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide hover:text-cobalt"
        >
          Далі <ArrowRightIcon className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-obsidian/30">
          Далі <ArrowRightIcon className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
