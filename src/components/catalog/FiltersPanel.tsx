"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  sizes: string[];
  colors: { color: string; colorHex: string }[];
  priceMin: number;
  priceMax: number;
};

export function FiltersPanel({ sizes, colors, priceMin, priceMax }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const selectedSizes = params.get("sizes")?.split(",").filter(Boolean) ?? [];
  const selectedColors = params.get("colors")?.split(",").filter(Boolean) ?? [];
  const maxPrice = Number(params.get("max") ?? priceMax);

  const update = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const toggleCsv = (key: string, value: string, current: string[]) => {
    const set = new Set(current);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    update((p) => {
      if (set.size === 0) p.delete(key);
      else p.set(key, Array.from(set).join(","));
    });
  };

  const hasFilters = selectedSizes.length > 0 || selectedColors.length > 0 || params.has("max");

  return (
    <aside className="w-full shrink-0 lg:w-60">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Фільтри</h3>
        {hasFilters && (
          <button
            onClick={() =>
              update((p) => {
                p.delete("sizes");
                p.delete("colors");
                p.delete("max");
              })
            }
            className="text-xs font-semibold text-cobalt underline underline-offset-2"
          >
            Скинути
          </button>
        )}
      </div>

      <div className="mt-8">
        <h4 className="text-sm font-bold">Розмір (вік)</h4>
        <div className="mt-4 flex flex-wrap gap-2">
          {sizes.map((size) => {
            const active = selectedSizes.includes(size);
            return (
              <button
                key={size}
                onClick={() => toggleCsv("sizes", size, selectedSizes)}
                className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition ${
                  active
                    ? "border-cobalt bg-cobalt/5 font-semibold text-cobalt"
                    : "border-[#E0E0E0] bg-white hover:border-obsidian"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <h4 className="text-sm font-bold">Кольори</h4>
        <div className="mt-4 space-y-3">
          {colors.map(({ color, colorHex }) => {
            const active = selectedColors.includes(color);
            return (
              <button
                key={color}
                onClick={() => toggleCsv("colors", color, selectedColors)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span
                  className={`h-5 w-5 rounded-full border ${
                    active ? "ring-2 ring-cobalt ring-offset-2" : "border-black/10"
                  }`}
                  style={{ backgroundColor: colorHex }}
                />
                <span
                  className={`text-sm ${active ? "font-semibold text-cobalt" : "text-obsidian/80"}`}
                >
                  {color}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <h4 className="text-sm font-bold">Ціна</h4>
        <input
          type="range"
          min={priceMin}
          max={priceMax}
          step={50}
          value={maxPrice}
          onChange={(e) => update((p) => p.set("max", e.target.value))}
          className="mt-4 w-full accent-cobalt"
          aria-label="Максимальна ціна"
        />
        <div className="mt-2 flex justify-between text-xs text-obsidian/60">
          <span>{priceMin.toLocaleString("en-US")} ₴</span>
          <span className="font-semibold text-obsidian">
            до {maxPrice.toLocaleString("en-US")} ₴
          </span>
        </div>
      </div>
    </aside>
  );
}
