"use client";

import Image from "next/image";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/format";
import { normalizeHex } from "@/lib/color";
import { DEFAULT_HEIGHT_SIZES, HEIGHT_SIZES, compareSizes } from "@/lib/sizes";
import { ImageColorPicker } from "@/components/admin/ImageColorPicker";
import { prepareProductImage, readJsonResponse } from "@/lib/prepare-product-image";

type Category = { id: string; name: string; slug?: string };
type ProductTypeOption = {
  id: string;
  name: string;
  slug: string;
  girlOnly: boolean;
  unisex: boolean;
};

type AdminColor = {
  id: string;
  name: string;
  colorHex: string;
  images: string[];
  sortOrder: number;
};

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  isFeatured: boolean;
  isSale: boolean;
  gender: "BOY" | "GIRL";
  categoryId: string;
  productTypeId: string | null;
  category: { name: string };
  productType: { name: string } | null;
  colors: AdminColor[];
  variants: { size: string; color: string; colorHex: string; stock: number; colorId: string | null }[];
};

type ColorSizeRow = { size: string; stock: number };

type FormColor = {
  key: string;
  name: string;
  colorHex: string;
  images: string[];
  sizes: ColorSizeRow[];
};

type FormState = {
  id?: string;
  name: string;
  slug?: string;
  description: string;
  price: string;
  compareAtPrice: string;
  categoryId: string;
  productTypeId: string;
  gender: "BOY" | "GIRL";
  colors: FormColor[];
  isFeatured: boolean;
  isSale: boolean;
};

function newColor(partial?: Partial<FormColor>): FormColor {
  return {
    key: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    colorHex: "",
    images: [],
    sizes: DEFAULT_HEIGHT_SIZES.map((size) => ({ size, stock: 1 })),
    ...partial,
  };
}

const EMPTY: FormState = {
  name: "",
  description: "",
  price: "",
  compareAtPrice: "",
  categoryId: "",
  productTypeId: "",
  gender: "BOY",
  colors: [newColor()],
  isFeatured: false,
  isSale: false,
};

function slugify(value: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z",
    и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
    р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
    щ: "shch", ь: "", ю: "iu", я: "ia",
  };
  return value
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toPayload(form: FormState) {
  const compareAt = form.compareAtPrice.trim();
  return {
    name: form.name,
    slug:
      (form.id ? form.slug : undefined) ||
      slugify(form.name) ||
      `product-${Date.now()}`,
    description: form.description,
    price: Number(form.price),
    compareAtPrice: compareAt ? Number(compareAt) : null,
    categoryId: form.categoryId,
    productTypeId: form.productTypeId,
    gender: form.gender,
    isFeatured: form.isFeatured,
    isSale: form.isSale,
    colors: form.colors.map((c) => {
      const hex = (normalizeHex(c.colorHex) ?? c.colorHex).toUpperCase();
      return {
        name: hex,
        colorHex: hex,
        images: c.images,
        sizes: c.sizes.map((s) => ({ size: s.size, stock: Math.max(0, Number(s.stock) || 0) })),
      };
    }),
  };
}

export function ProductsManager({
  categories,
  productTypes,
}: {
  categories: Category[];
  productTypes: ProductTypeOption[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [activeColorKey, setActiveColorKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const defaultCategoryId =
    categories.find((c) => c.slug === "kidswear")?.id ?? categories[0]?.id ?? "";

  const availableTypes = (gender: "BOY" | "GIRL") =>
    productTypes.filter((t) => t.unisex || !t.girlOnly || gender === "GIRL");

  const selectedType = form
    ? productTypes.find((t) => t.id === form.productTypeId)
    : undefined;
  const typeIsUnisex = Boolean(selectedType?.unisex);

  const { data, isLoading } = useQuery<{ products: AdminProduct[] }>({
    queryKey: ["admin-products"],
    queryFn: async () => (await fetch("/api/admin/products")).json(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-products"] });

  const save = useMutation({
    mutationFn: async (state: FormState) => {
      if (!state.productTypeId) throw new Error("Оберіть категорію товару");
      if (!state.categoryId && !defaultCategoryId) {
        throw new Error("Немає каталогу в базі — спочатку створіть категорію kidswear");
      }
      const withCategory = {
        ...state,
        categoryId: state.categoryId || defaultCategoryId,
      };
      if (withCategory.colors.length === 0) throw new Error("Додайте хоча б один колір");
      for (const c of withCategory.colors) {
        if (c.images.length === 0) throw new Error("У кожного кольору має бути хоча б одне фото");
        if (!normalizeHex(c.colorHex)) {
          throw new Error("Оберіть колір з фото піпеткою для кожного варіанту");
        }
        if (c.sizes.length === 0) throw new Error("У кожного кольору оберіть розміри");
      }
      const payload = toPayload(withCategory);
      const res = await fetch(
        withCategory.id ? `/api/admin/products/${withCategory.id}` : "/api/admin/products",
        {
          method: withCategory.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const json = await readJsonResponse<{ error?: string }>(res);
        throw new Error(json.error ?? "Помилка збереження");
      }
    },
    onSuccess: () => {
      setForm(null);
      setError("");
      invalidate();
    },
    onError: (e) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    },
    onSuccess: invalidate,
  });

  const edit = (p: AdminProduct) => {
    const colors: FormColor[] =
      p.colors.length > 0
        ? [...p.colors]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((c) => {
              const hex = normalizeHex(c.colorHex) ?? c.colorHex.toUpperCase();
              const sizes = p.variants
                .filter((v) => (v.colorId ? v.colorId === c.id : v.colorHex.toUpperCase() === hex))
                .map((v) => ({ size: v.size, stock: v.stock }))
                .sort((a, b) => compareSizes(a.size, b.size));
              return {
                key: c.id,
                name: c.name,
                colorHex: hex,
                images: c.images.length ? c.images : p.images,
                sizes:
                  sizes.length > 0
                    ? sizes
                    : DEFAULT_HEIGHT_SIZES.map((size) => ({ size, stock: 1 })),
              };
            })
        : [
            newColor({
              images: p.images,
              colorHex: p.variants[0]?.colorHex ?? "#3B5BFF",
              sizes: Array.from(
                new Map(p.variants.map((v) => [v.size, v.stock])).entries(),
                ([size, stock]) => ({ size, stock })
              ).sort((a, b) => compareSizes(a.size, b.size)),
            }),
          ];

    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : "",
      categoryId: defaultCategoryId,
      productTypeId: p.productTypeId ?? "",
      gender: p.gender ?? "BOY",
      colors,
      isFeatured: p.isFeatured,
      isSale: p.isSale,
    });
    setActiveColorKey(colors[0]?.key ?? null);
  };

  const openNew = () => {
    const gender: "BOY" | "GIRL" = "BOY";
    const types = availableTypes(gender);
    const color = newColor();
    setForm({
      ...EMPTY,
      categoryId: defaultCategoryId,
      productTypeId: types[0]?.id ?? "",
      gender,
      colors: [color],
    });
    setActiveColorKey(color.key);
  };

  const updateColor = (key: string, patch: Partial<FormColor>) => {
    if (!form) return;
    setForm({
      ...form,
      colors: form.colors.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    });
  };

  const toggleColorSize = (key: string, size: string) => {
    if (!form) return;
    setForm({
      ...form,
      colors: form.colors.map((c) => {
        if (c.key !== key) return c;
        const exists = c.sizes.find((s) => s.size === size);
        const sizes = exists
          ? c.sizes.filter((s) => s.size !== size)
          : [...c.sizes, { size, stock: 1 }].sort((a, b) => compareSizes(a.size, b.size));
        return { ...c, sizes };
      }),
    });
  };

  const setColorSizeStock = (key: string, size: string, stock: number) => {
    if (!form) return;
    setForm({
      ...form,
      colors: form.colors.map((c) => {
        if (c.key !== key) return c;
        return {
          ...c,
          sizes: c.sizes.map((s) => (s.size === size ? { ...s, stock } : s)),
        };
      }),
    });
  };

  const uploadToColor = async (key: string, files: FileList | null) => {
    if (!files?.length || !form) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: string[] = [];
      for (const original of Array.from(files)) {
        const file = await prepareProductImage(original);
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const json = await readJsonResponse<{ error?: string; url?: string }>(res);
        if (!res.ok || !json.url) throw new Error(json.error ?? "Не вдалося завантажити фото");
        uploaded.push(json.url);
      }
      const color = form.colors.find((c) => c.key === key);
      if (!color) return;
      updateColor(key, { images: [...color.images, ...uploaded] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  };

  const activeColor = form?.colors.find((c) => c.key === activeColorKey) ?? form?.colors[0];

  return (
    <div className="mt-6">
      {!form && (
        <button onClick={openNew} className="btn-primary">
          + Додати товар
        </button>
      )}

      {form && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form);
          }}
          className="space-y-5 rounded-card bg-white p-6"
        >
          <h2 className="font-display text-lg font-bold">
            {form.id ? "Редагування товару" : "Новий товар"}
          </h2>

          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Назва"
            className="input-base"
          />

          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Опис"
            rows={4}
            className="input-base"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Поточна ціна, ₴"
              className="input-base"
            />
            <input
              type="number"
              min={1}
              value={form.compareAtPrice}
              onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
              placeholder="Стара ціна, ₴ (опційно)"
              className="input-base"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {!typeIsUnisex && (
              <select
                required
                value={form.gender}
                onChange={(e) => {
                  const gender = e.target.value as "BOY" | "GIRL";
                  const types = availableTypes(gender);
                  const stillValid = types.some((t) => t.id === form.productTypeId);
                  setForm({
                    ...form,
                    gender,
                    productTypeId: stillValid ? form.productTypeId : types[0]?.id ?? "",
                  });
                }}
                className="input-base cursor-pointer"
              >
                <option value="BOY">Хлопчик</option>
                <option value="GIRL">Дівчинка</option>
              </select>
            )}
            <select
              required
              value={form.productTypeId}
              onChange={(e) => {
                const productTypeId = e.target.value;
                const next = productTypes.find((t) => t.id === productTypeId);
                setForm({
                  ...form,
                  productTypeId,
                  // Окуляри без статі — залишаємо технічне значення за замовчуванням
                  gender: next?.unisex ? "BOY" : form.gender,
                });
              }}
              className={`input-base cursor-pointer ${typeIsUnisex ? "sm:col-span-2" : ""}`}
            >
              <option value="" disabled>
                Категорія...
              </option>
              {availableTypes(form.gender).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-black/5 bg-chalk/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Кольори моделі</p>
                <p className="mt-1 text-[12px] text-obsidian/50">
                  Фото → колір піпеткою з фото → розміри й залишки. Без назв і ручного HEX.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const c = newColor();
                  setForm({ ...form, colors: [...form.colors, c] });
                  setActiveColorKey(c.key);
                }}
                className="rounded-lg border border-cobalt px-3 py-1.5 text-[12px] font-bold uppercase text-cobalt"
              >
                + Колір
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {form.colors.map((c) => {
                const active = (activeColor?.key ?? "") === c.key;
                const hasColor = Boolean(normalizeHex(c.colorHex));
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setActiveColorKey(c.key)}
                    aria-label={hasColor ? c.colorHex : "Новий колір"}
                    className={`h-9 w-9 rounded-full border transition ${
                      active
                        ? "border-cobalt ring-2 ring-cobalt ring-offset-2"
                        : "border-black/15 hover:scale-105"
                    } ${hasColor ? "" : "border-dashed bg-white"}`}
                    style={hasColor ? { backgroundColor: c.colorHex } : undefined}
                  />
                );
              })}
            </div>

            {activeColor && (
              <div className="mt-5 space-y-4 rounded-xl bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Варіант кольору</p>
                  {form.colors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = form.colors.filter((c) => c.key !== activeColor.key);
                        setForm({ ...form, colors: next });
                        setActiveColorKey(next[0]?.key ?? null);
                      }}
                      className="text-[13px] font-semibold text-red-500 underline"
                    >
                      Видалити колір
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Фото цього кольору</p>
                    <label className="cursor-pointer rounded-lg border border-[#E0E0E0] bg-white px-3 py-1.5 text-sm font-semibold hover:border-obsidian">
                      {uploading ? "Завантаження..." : "Додати фото"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                        multiple
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          void uploadToColor(activeColor.key, e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  {activeColor.images.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {activeColor.images.map((url) => (
                        <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-xl bg-chalk">
                          <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              updateColor(activeColor.key, {
                                images: activeColor.images.filter((img) => img !== url),
                              })
                            }
                            className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-obsidian/50">Додайте фото саме цього кольору</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Колір з фото</p>
                  <ImageColorPicker
                    mode="single"
                    images={activeColor.images}
                    colors={normalizeHex(activeColor.colorHex) ? [normalizeHex(activeColor.colorHex)!] : []}
                    onChangeColors={(hexes) => {
                      const hex = hexes[0];
                      if (hex) updateColor(activeColor.key, { colorHex: hex, name: hex });
                    }}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold">Розміри та залишок</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {HEIGHT_SIZES.map((size) => {
                      const row = activeColor.sizes.find((s) => s.size === size);
                      const active = Boolean(row);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleColorSize(activeColor.key, size)}
                          className={`rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition ${
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
                  {activeColor.sizes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {activeColor.sizes.map((row) => (
                        <div
                          key={row.size}
                          className="flex items-center justify-between gap-3 rounded-lg border border-black/5 px-3 py-2"
                        >
                          <span className="text-sm font-medium">{row.size}</span>
                          <label className="flex items-center gap-2 text-[13px] text-obsidian/60">
                            Залишок
                            <input
                              type="number"
                              min={0}
                              value={row.stock}
                              onChange={(e) =>
                                setColorSizeStock(
                                  activeColor.key,
                                  row.size,
                                  Math.max(0, Number(e.target.value) || 0)
                                )
                              }
                              className="w-20 rounded-lg border border-[#E0E0E0] px-2 py-1.5 text-sm font-semibold text-obsidian outline-none focus:border-cobalt"
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isFeatured: e.target.checked,
                    isSale: e.target.checked ? false : form.isSale,
                  })
                }
                className="accent-cobalt"
              />
              У розділі «Новинки»
              <span className="text-obsidian/45"> (30 днів)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isSale}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isSale: e.target.checked,
                    isFeatured: e.target.checked ? false : form.isFeatured,
                  })
                }
                className="accent-cobalt"
              />
              У розділі «Розпродаж»
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={save.isPending || uploading} className="btn-primary">
              {save.isPending ? "Зберігаємо..." : "Зберегти"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="btn-secondary">
              Скасувати
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-card bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase text-obsidian/50">
            <tr>
              <th className="px-5 py-3.5">Назва</th>
              <th className="px-5 py-3.5">Категорія</th>
              <th className="px-5 py-3.5">Для кого</th>
              <th className="px-5 py-3.5">Ціна</th>
              <th className="px-5 py-3.5">Кольори</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-obsidian/50">
                  Завантаження...
                </td>
              </tr>
            )}
            {data?.products.map((p) => {
              const hexes =
                p.colors?.length > 0
                  ? p.colors.map((c) => c.colorHex)
                  : Array.from(new Set(p.variants.map((v) => v.colorHex)));
              return (
                <tr key={p.id}>
                  <td className="px-5 py-3.5 font-medium">
                    {p.name}
                    {p.isFeatured && (
                      <span className="ml-2 rounded bg-cobalt/10 px-1.5 py-0.5 text-[10px] font-bold text-cobalt">
                        Новинка
                      </span>
                    )}
                    {p.isSale && (
                      <span className="ml-2 rounded bg-obsidian px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Розпродаж
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-obsidian/60">{p.productType?.name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-obsidian/60">
                    {p.gender === "GIRL" ? "Дівчинка" : "Хлопчик"}
                  </td>
                  <td className="px-5 py-3.5">
                    {formatPrice(p.price)}
                    {p.compareAtPrice != null && p.compareAtPrice > p.price && (
                      <span className="ml-2 text-obsidian/40 line-through">
                        {formatPrice(p.compareAtPrice)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5">
                      {hexes.slice(0, 6).map((hex) => (
                        <span
                          key={hex}
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => edit(p)} className="font-semibold text-cobalt hover:underline">
                      Редагувати
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Видалити «${p.name}»?`)) remove.mutate(p.id);
                      }}
                      className="ml-4 font-semibold text-red-500 hover:underline"
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
