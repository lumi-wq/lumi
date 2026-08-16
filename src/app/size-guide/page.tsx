import { SIZE_CHART, formatHeightSize } from "@/lib/sizes";
import { CatalogFaq } from "@/components/catalog/CatalogFaq";
import { JsonLd } from "@/components/seo/JsonLd";
import { canonicalMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Таблиця розмірів дитячого одягу 6–16 років",
  description:
    "Як підібрати розмір дитячого одягу LUMI за ростом. Таблиця відповідності вік — ріст для дітей 6–16 років.",
  ...canonicalMetadata("/size-guide"),
};

const FAQ = [
  {
    q: "Як обрати розмір, якщо дитина між значеннями?",
    a: "Беріть більший ріст. Діти швидко ростуть, а трохи вільніша посадка комфортніша за коротку.",
  },
  {
    q: "Чому орієнтир — ріст, а не вік?",
    a: "Діти одного віку сильно відрізняються за зростом. Вік у таблиці лише підказка, щоб швидше знайти діапазон.",
  },
  {
    q: "Де подивитися доступні рости конкретного товару?",
    a: "На сторінці товару і в фільтрі каталогу. Якщо потрібного росту немає — оберіть найближчий більший або іншу модель.",
  },
];

export default function SizeGuidePage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Таблиця розмірів",
        item: absoluteUrl("/size-guide"),
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <section className="bg-white">
        <div className="container-content py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/50">
            Довідка
          </p>
          <h1 className="mt-3 font-display text-3xl font-black md:text-[40px]">
            Таблиця розмірів дитячого одягу
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-obsidian/70">
            Основний орієнтир LUMI — <span className="font-semibold text-obsidian">ріст</span> у
            сантиметрах. Вік лише підказка: діти 8 років можуть носити і 128 см, і 140 см. Замовляйте
            на сайті після перевірки таблиці — доставка Новою Поштою по Україні.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-obsidian/70">
            Шукаєте одяг під конкретний вік? Перейдіть у{" "}
            <Link href="/category/girls/6-8-rokiv" className="font-medium text-cobalt underline">
              6–8 років
            </Link>
            ,{" "}
            <Link href="/category/girls/9-12-rokiv" className="font-medium text-cobalt underline">
              9–12
            </Link>{" "}
            або{" "}
            <Link href="/category/pidlitkovyy-odyag" className="font-medium text-cobalt underline">
              підлітковий одяг 13–16
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="border-t border-black/5 bg-chalk py-12">
        <div className="container-content max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-obsidian text-white">
                  <th className="px-5 py-3.5 font-semibold">Вік</th>
                  <th className="px-5 py-3.5 font-semibold">Ріст, діапазон</th>
                  <th className="px-5 py-3.5 font-semibold">Розмір LUMI</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_CHART.map((row, i) => (
                  <tr
                    key={row.age}
                    className={`border-t border-black/5 ${i % 2 === 0 ? "bg-white" : "bg-chalk/60"}`}
                  >
                    <td className="px-5 py-3.5 text-obsidian/80">{row.age} років</td>
                    <td className="px-5 py-3.5 tabular-nums text-obsidian/70">
                      {row.heightRange} см
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-md bg-cobalt/10 px-2.5 py-1 text-[13px] font-bold tabular-nums text-cobalt">
                        {formatHeightSize(row.heightCm)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-obsidian/55">
            Якщо точного росту немає в товарі — оберіть найближчий більший розмір.
          </p>
        </div>
      </section>

      <CatalogFaq items={FAQ} path="/size-guide" />
    </>
  );
}
