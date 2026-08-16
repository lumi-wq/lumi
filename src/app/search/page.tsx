import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toCardData } from "@/lib/types";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SearchBanner } from "@/components/catalog/SearchBanner";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata = { title: "Пошук", ...NOINDEX_FOLLOW };

function resultsLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} результат`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} результати`;
  return `${count} результатів`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? "";

  const products = q
    ? await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { tag: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { variants: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      })
    : [];

  return (
    <>
      <section className="bg-white">
        <div className="container-content py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/50">
            Результати пошуку
          </p>
          <SearchBanner initialQuery={q} />
          {q && (
            <h1 className="mt-6 font-display text-2xl font-black md:text-[28px]">
              Знайдено {resultsLabel(products.length)} за запитом «{q}»
            </h1>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="container-content">
          {products.length > 0 && <ProductGrid products={products.map(toCardData)} />}

          {(products.length === 0 || !q) && (
            <div className="mx-auto mt-4 max-w-3xl rounded-card bg-white p-12 text-center">
              <h2 className="font-display text-2xl font-black">
                {q ? "Нічого не знайшли або шукаєте щось інше?" : "Що будемо шукати?"}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-obsidian/60">
                Спробуйте переглянути наші основні категорії одягу або скористайтеся фільтрами для
                точнішого пошуку.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/category/girls" className="btn-secondary">
                  Дівчатка
                </Link>
                <Link href="/category/boys" className="btn-secondary">
                  Хлопчики
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
