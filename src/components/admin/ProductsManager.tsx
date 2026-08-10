"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/format";

type Category = { id: string; name: string };
type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  tag: string | null;
  tagStyle: string | null;
  isFeatured: boolean;
  categoryId: string;
  category: { name: string };
  variants: { size: string; color: string; colorHex: string; stock: number }[];
};

type FormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  categoryId: string;
  images: string;
  tag: string;
  tagStyle: string;
  sizes: string;
  colors: string;
  stock: string;
  isFeatured: boolean;
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  categoryId: "",
  images: "",
  tag: "",
  tagStyle: "cobalt",
  sizes: "8 років, 10 років, 12 років, 14 років, 16 років",
  colors: "Яскраво-синій:#3B5BFF, Кремовий:#F1E8DC",
  stock: "10",
  isFeatured: false,
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
  return {
    name: form.name,
    slug: form.slug || slugify(form.name),
    description: form.description,
    price: Number(form.price),
    categoryId: form.categoryId,
    images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
    tag: form.tag.trim() || null,
    tagStyle: form.tagStyle,
    isFeatured: form.isFeatured,
    sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    colors: form.colors
      .split(",")
      .map((pair) => {
        const [color, colorHex] = pair.split(":").map((s) => s.trim());
        return { color, colorHex: colorHex ?? "#CCCCCC" };
      })
      .filter((c) => c.color),
    stock: Number(form.stock) || 10,
  };
}

export function ProductsManager({ categories }: { categories: Category[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery<{ products: AdminProduct[] }>({
    queryKey: ["admin-products"],
    queryFn: async () => (await fetch("/api/admin/products")).json(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-products"] });

  const save = useMutation({
    mutationFn: async (state: FormState) => {
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
    const colorMap = new Map(p.variants.map((v) => [v.color, v.colorHex]));
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: String(p.price),
      categoryId: p.categoryId,
      images: p.images.join("\n"),
      tag: p.tag ?? "",
      tagStyle: p.tagStyle ?? "cobalt",
      sizes: sizes.join(", "),
      colors: Array.from(colorMap, ([c, h]) => `${c}:${h}`).join(", "),
      stock: String(p.variants[0]?.stock ?? 10),
      isFeatured: p.isFeatured,
    });
  };

  return (
    <div className="mt-6">
      {!form && (
        <button
          onClick={() => setForm({ ...EMPTY, categoryId: categories[0]?.id ?? "" })}
          className="btn-primary"
        >
          + Додати товар
        </button>
      )}

      {form && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form);
          }}
          className="space-y-4 rounded-card bg-white p-6"
        >
          <h2 className="font-display text-lg font-bold">
            {form.id ? "Редагування товару" : "Новий товар"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Назва"
              className="input-base"
            />
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="Slug (авто з назви)"
              className="input-base"
            />
            <input
              required
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Ціна, ₴"
              className="input-base"
            />
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="input-base cursor-pointer"
            >
              <option value="" disabled>
                Категорія...
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              placeholder="Тег (Хіт, Еко...)"
              className="input-base"
            />
            <select
              value={form.tagStyle}
              onChange={(e) => setForm({ ...form, tagStyle: e.target.value })}
              className="input-base cursor-pointer"
            >
              <option value="cobalt">Тег: кобальтовий</option>
              <option value="dark">Тег: чорний</option>
            </select>
          </div>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Опис"
            rows={3}
            className="input-base"
          />
          <textarea
            required
            value={form.images}
            onChange={(e) => setForm({ ...form, images: e.target.value })}
            placeholder="URL зображень (по одному в рядку)"
            rows={3}
            className="input-base font-mono text-xs"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <input
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
              placeholder="Розміри через кому"
              className="input-base"
            />
            <input
              value={form.colors}
              onChange={(e) => setForm({ ...form, colors: e.target.value })}
              placeholder="Кольори (Назва:#hex, ...)"
              className="input-base"
            />
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="Залишок на варіант"
              className="input-base"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="accent-cobalt"
            />
            Показувати на головній (хіти продажів)
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={save.isPending} className="btn-primary">
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
              <th className="px-5 py-3.5">Ціна</th>
              <th className="px-5 py-3.5">Варіантів</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-obsidian/50">
                  Завантаження...
                </td>
              </tr>
            )}
            {data?.products.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3.5 font-medium">
                  {p.name}
                  {p.tag && (
                    <span className="ml-2 rounded bg-cobalt/10 px-1.5 py-0.5 text-[10px] font-bold text-cobalt">
                      {p.tag}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-obsidian/60">{p.category.name}</td>
                <td className="px-5 py-3.5">{formatPrice(p.price)}</td>
                <td className="px-5 py-3.5">{p.variants.length}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
