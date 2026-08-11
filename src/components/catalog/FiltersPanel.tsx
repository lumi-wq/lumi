"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export const GENDER_OPTIONS = [
  { value: "BOY", label: "Хлопчики" },
  { value: "GIRL", label: "Дівчатка" },
] as const;

export type FilterProductType = {
  slug: string;
  name: string;
  girlOnly: boolean;
};

type Props = {
  sizes: string[];
  productTypes: FilterProductType[];
};

export function FiltersPanel({ sizes, productTypes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const selectedGender = params.get("gender");
  const selectedType = params.get("type");
  const selectedSizes = params.get("sizes")?.split(",").filter(Boolean) ?? [];

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

  const setGender = (value: string | null) => {
    update((p) => {
      if (!value) p.delete("gender");
      else p.set("gender", value);
      p.delete("type");
      p.delete("sizes");
    });
  };

  const setType = (value: string | null) => {
    update((p) => {
      if (!value) p.delete("type");
      else p.set("type", value);
      p.delete("sizes");
    });
  };

  const visibleTypes = productTypes.filter(
    (t) => !t.girlOnly || selectedGender === "GIRL"
  );

  const hasFilters =
    Boolean(selectedGender) || Boolean(selectedType) || selectedSizes.length > 0;

  return (
    <aside className="w-full shrink-0 lg:w-60">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Фільтри</h3>
        {hasFilters && (
          <button
            onClick={() =>
              update((p) => {
                p.delete("gender");
                p.delete("type");
                p.delete("sizes");
              })
            }
            className="text-xs font-semibold text-cobalt underline underline-offset-2"
          >
            Скинути
          </button>
        )}
      </div>

      <div className="mt-8">
        <h4 className="text-sm font-bold">Для кого</h4>
        <div className="mt-4 flex flex-col gap-2">
          {GENDER_OPTIONS.map((opt) => {
            const active = selectedGender === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setGender(active ? null : opt.value)}
                className={`rounded-lg border px-3 py-2.5 text-left text-[13px] font-medium transition ${
                  active
                    ? "border-cobalt bg-cobalt/5 font-semibold text-cobalt"
                    : "border-[#E0E0E0] bg-white hover:border-obsidian"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {selectedGender ? (
        <div className="mt-8">
          <h4 className="text-sm font-bold">Категорія</h4>
          <div className="mt-4 flex flex-col gap-2">
            {visibleTypes.map((t) => {
              const active = selectedType === t.slug;
              return (
                <button
                  key={t.slug}
                  onClick={() => setType(active ? null : t.slug)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-[13px] font-medium transition ${
                    active
                      ? "border-cobalt bg-cobalt/5 font-semibold text-cobalt"
                      : "border-[#E0E0E0] bg-white hover:border-obsidian"
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-8 text-sm text-obsidian/50">
          Оберіть хлопчиків або дівчаток, щоб побачити категорії.
        </p>
      )}

      <div className="mt-8">
        <h4 className="text-sm font-bold">Вік / розмір</h4>
        {sizes.length === 0 ? (
          <p className="mt-4 text-sm text-obsidian/50">Немає доступних розмірів</p>
        ) : (
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
        )}
      </div>
    </aside>
  );
}
