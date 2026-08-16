import type { SeoFaq } from "@/lib/seo-landings";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";

export function CatalogFaq({ items, path }: { items: SeoFaq[]; path: string }) {
  if (items.length === 0) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
    url: absoluteUrl(path),
  };

  return (
    <section className="border-t border-black/5 bg-white py-16">
      <JsonLd data={jsonLd} />
      <div className="container-content max-w-3xl">
        <h2 className="font-display text-2xl font-black">Часті запитання</h2>
        <dl className="mt-8 space-y-6">
          {items.map((item) => (
            <div key={item.q}>
              <dt className="text-[15px] font-bold">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-obsidian/70">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
