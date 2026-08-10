"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "recommended", label: "Рекомендовані" },
  { value: "price-asc", label: "Ціна: за зростанням" },
  { value: "price-desc", label: "Ціна: за спаданням" },
  { value: "newest", label: "За новизною" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("sort") ?? "recommended";

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-obsidian/60">Сортувати:</span>
      <select
        value={current}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === "recommended") next.delete("sort");
          else next.set("sort", e.target.value);
          next.delete("page");
          router.replace(`${pathname}?${next.toString()}`, { scroll: false });
        }}
        className="cursor-pointer bg-transparent font-semibold outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
