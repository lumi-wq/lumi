"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { typeClusterPath } from "@/lib/seo-landing-paths";
import { trackFilter } from "@/lib/ga";

export const GENDER_OPTIONS = [
  { value: "BOY", label: "Хлопчики" },
  { value: "GIRL", label: "Дівчатка" },
] as const;

export type FilterGender = "BOY" | "GIRL";

export type FilterProductType = {
  slug: string;
  name: string;
  girlOnly: boolean;
  unisex?: boolean;
};

type Props = {
  sizes: string[];
  productTypes: FilterProductType[];
  /** Якщо задано (сторінки Дівчатка / Хлопчики) — фільтр «Для кого» прихований */
  lockedGender?: FilterGender;
  /** Приховати стать (напр. обрані Окуляри) */
  hideGenderFilter?: boolean;
  /** Тип уже зафіксований одним значенням — ховаємо «Категорія» */
  lockedProductType?: boolean;
  /**
   * Типи завжди видимі (Аксесуари: Шапки / Сумки / Окуляри),
   * без вимоги спочатку обрати стать.
   */
  typesAlwaysVisible?: boolean;
  /** Підпис блоку типів */
  typeFilterLabel?: string;
  /** Сховати фільтр росту (аксесуари) */
  hideSizeFilter?: boolean;
  /** SEO-лендінги замість ?type= */
  typeNavParent?: "girls" | "boys" | "accessories";
  selectedTypeSlug?: string;
};

export function FiltersPanel({
  sizes,
  productTypes,
  lockedGender,
  hideGenderFilter,
  lockedProductType,
  typesAlwaysVisible,
  typeFilterLabel = "Категорія",
  hideSizeFilter,
  typeNavParent,
  selectedTypeSlug,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const selectedGender = lockedGender ?? params.get("gender");
  const selectedType = selectedTypeSlug ?? params.get("type");
  const selectedSizes = params.get("sizes")?.split(",").filter(Boolean) ?? [];
  const selectedTypeMeta = productTypes.find((t) => t.slug === selectedType);
  const hideGender =
    Boolean(hideGenderFilter) || Boolean(selectedTypeMeta?.unisex);

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
    if (lockedGender || hideGender) return;
    if (value) trackFilter("gender", value);
    update((p) => {
      if (!value) p.delete("gender");
      else p.set("gender", value);
      if (!lockedProductType && !typesAlwaysVisible) p.delete("type");
      p.delete("sizes");
    });
  };

  const setType = (value: string | null) => {
    if (lockedProductType) return;
    if (value) trackFilter("category", value);
    if (typeNavParent) {
      router.push(typeClusterPath(typeNavParent, value));
      return;
    }
    const nextMeta = value ? productTypes.find((t) => t.slug === value) : null;
    update((p) => {
      if (!value) p.delete("type");
      else p.set("type", value);
      if (nextMeta?.unisex) p.delete("gender");
      p.delete("sizes");
    });
  };

  const visibleTypes = productTypes.filter(
    (t) => t.unisex || !t.girlOnly || selectedGender === "GIRL" || typesAlwaysVisible
  );

  const showTypeFilter =
    !lockedProductType &&
    (typesAlwaysVisible || Boolean(selectedGender) || Boolean(lockedGender));

  const hasFilters =
    (!lockedGender && !hideGender && Boolean(selectedGender)) ||
    (!lockedProductType && Boolean(selectedType)) ||
    (!hideSizeFilter && selectedSizes.length > 0);

  return (
    <aside className="w-full shrink-0 lg:w-60">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Фільтри</h3>
        {hasFilters && (
          <button
            onClick={() => {
              if (typeNavParent) {
                router.push(typeClusterPath(typeNavParent, null));
                return;
              }
              update((p) => {
                if (!lockedGender) p.delete("gender");
                if (!lockedProductType) p.delete("type");
                if (!hideSizeFilter) p.delete("sizes");
              });
            }}
            className="text-xs font-semibold text-cobalt underline underline-offset-2"
          >
            Скинути
          </button>
        )}
      </div>

      {!lockedGender && !hideGender && (
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
      )}

      {showTypeFilter ? (
        <div className="mt-8">
          <h4 className="text-sm font-bold">{typeFilterLabel}</h4>
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
        !lockedProductType && (
          <p className="mt-8 text-sm text-obsidian/50">
            Оберіть хлопчиків або дівчаток, щоб побачити категорії.
          </p>
        )
      )}

      {!hideSizeFilter && (
        <div className="mt-8">
          <h4 className="text-sm font-bold">Ріст</h4>
          {sizes.length === 0 ? (
            <p className="mt-4 text-sm text-obsidian/50">Немає доступних розмірів</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {sizes.map((size) => {
                const active = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => {
                      if (!active) trackFilter("size", size);
                      toggleCsv("sizes", size, selectedSizes);
                    }}
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
      )}
    </aside>
  );
}
