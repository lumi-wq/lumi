"use client";

import Image from "next/image";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/format";
import { normalizeHex } from "@/lib/color";
import { ImageColorPicker } from "@/components/admin/ImageColorPicker";

type Category = { id: string; name: string; slug?: string };
type ProductTypeOption = { id: string; name: string; slug: string; girlOnly: boolean };
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
  variants: { size: string; color: string; colorHex: string; stock: number }[];
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
  images: string[];
  colorHexes: string[];
  sizes: string;
  stock: string;
  isSale: boolean;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  price: "",
  compareAtPrice: "",
  categoryId: "",
  productTypeId: "",
  gender: "BOY",
  images: [],
  colorHexes: [],
  sizes: "8 років, 10 років, 12 років, 14 років, 16 років",
  stock: "10",
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
  const colors = form.colorHexes
    .map((hex) => normalizeHex(hex))
    .filter((hex): hex is string => Boolean(hex))
    .map((hex) => ({ color: hex, colorHex: hex }));

  return {
    name: form.name,
    slug: form.slug || slugify(form.name) || `product-${Date.now()}`,
    description: form.description,
    price: Number(form.price),
    compareAtPrice: compareAt ? Number(compareAt) : null,
    categoryId: form.categoryId,
    productTypeId: form.productTypeId,
    gender: form.gender,
    images: form.images,
    isSale: form.isSale,
    sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    colors,
    stock: Number(form.stock) || 10,
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
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const availableTypes = (gender: "BOY" | "GIRL") =>
    productTypes.filter((t) => !t.girlOnly || gender === "GIRL");

  const { data, isLoading } = useQuery<{ products: AdminProduct[] }>({
    queryKey: ["admin-products"],
    queryFn: async () => (await fetch("/api/admin/products")).json(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-products"] });

  const save = useMutation({
    mutationFn: async (state: FormState) => {
      if (state.images.length === 0) throw new Error("Додайте хоча б одне фото");
      if (state.colorHexes.length === 0) throw new Error("Додайте хоча б один колір з фото");
      if (!state.productTypeId) throw new Error("Оберіть категорію товару");
      const payload = toPayload(state);
      const res = await fetch(
        state.id ? `/api/admin/products/${state.id}` : "/api/admin/products",
        {
          method: state.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error ?? "Помилка збереження");
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
    const sizes = Array.from(new Set(p.variants.map((v) => v.size)));
    const hexes = Array.from(
      new Set(p.variants.map((v) => normalizeHex(v.colorHex) ?? v.colorHex.toUpperCase()))
    );
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : "",
      categoryId: p.categoryId,
      productTypeId: p.productTypeId ?? "",
      gender: p.gender ?? "BOY",
      images: p.images,
      colorHexes: hexes,
      sizes: sizes.join(", "),
      stock: String(p.variants[0]?.stock ?? 10),
      isSale: p.isSale,
    });
  };

  const openNew = () => {
    const gender: "BOY" | "GIRL" = "BOY";
    const types = availableTypes(gender);
    setForm({
      ...EMPTY,
      categoryId: categories[0]?.id ?? "",
      productTypeId: types[0]?.id ?? "",
      gender,
    });
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length || !form) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Не вдалося завантажити фото");
        uploaded.push(json.url as string);
      }
      setForm({ ...form, images: [...form.images, ...uploaded] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    if (!form) return;
    setForm({ ...form, images: form.images.filter((img) => img !== url) });
  };

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
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="input-base cursor-pointer"
            >
              <option value="" disabled>
                Вікова група...
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
            <select
              required
              value={form.productTypeId}
              onChange={(e) => setForm({ ...form, productTypeId: e.target.value })}
              className="input-base cursor-pointer sm:col-span-2"
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
            <input
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
              placeholder="Розміри / вік через кому"
              className="input-base sm:col-span-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Фото</p>
              <label className="cursor-pointer rounded-lg border border-[#E0E0E0] bg-white px-3 py-1.5 text-sm font-semibold hover:border-obsidian">
                {uploading ? "Завантаження..." : "Додати з компʼютера"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    void uploadFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {form.images.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {form.images.map((url) => (
                  <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-xl bg-chalk">
                    <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-obsidian/50">Ще немає фото</p>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Кольори з фото</p>
            <ImageColorPicker
              images={form.images}
              colors={form.colorHexes}
              onChangeColors={(colorHexes) => setForm({ ...form, colorHexes })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isSale}
              onChange={(e) => setForm({ ...form, isSale: e.target.checked })}
              className="accent-cobalt"
            />
            У розділі «Розпродаж»
          </label>

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
              <th className="px-5 py-3.5">Вікова група</th>
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
                <td colSpan={7} className="px-5 py-8 text-center text-obsidian/50">
                  Завантаження...
                </td>
              </tr>
            )}
            {data?.products.map((p) => {
              const hexes = Array.from(new Set(p.variants.map((v) => v.colorHex)));
              return (
                <tr key={p.id}>
                  <td className="px-5 py-3.5 font-medium">
                    {p.name}
                    {p.isSale && (
                      <span className="ml-2 rounded bg-obsidian px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Розпродаж
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-obsidian/60">{p.category.name}</td>
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
