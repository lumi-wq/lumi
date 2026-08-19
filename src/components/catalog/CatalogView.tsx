import { ProductGrid } from "@/components/product/ProductGrid";
import { FiltersPanel } from "@/components/catalog/FiltersPanel";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Pagination } from "@/components/catalog/Pagination";
import { RelatedLandings } from "@/components/catalog/RelatedLandings";
import { CatalogFaq } from "@/components/catalog/CatalogFaq";
import { JsonLd } from "@/components/seo/JsonLd";
import { productCountLabel } from "@/lib/format";
import { toCardData } from "@/lib/types";
import { absoluteUrl } from "@/lib/site";
import type { CatalogCollection, CatalogListing } from "@/lib/catalog";

export type CatalogCrumb = { name: string; href?: string };

export function CatalogView({
  collection,
  listing,
  crumbs,
  typeNavParent,
}: {
  collection: CatalogCollection;
  listing: CatalogListing;
  crumbs: CatalogCrumb[];
  typeNavParent?: "girls" | "boys" | "accessories";
}) {
  const { from, to, total, products, page, totalPages } = listing;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.h1,
    description: collection.description,
    url: absoluteUrl(collection.path),
    isPartOf: { "@type": "WebSite", name: "LUMI", url: absoluteUrl("/") },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: absoluteUrl("/") },
      ...crumbs.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: crumb.name,
        item: absoluteUrl(crumb.href ?? collection.path),
      })),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbLd} />
      <section className="bg-white">
        <div className="container-content py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/50">
            Колекція / {crumbs.map((c) => c.name).join(" / ")}
          </p>
          <h1 className="mt-3 font-display text-3xl font-black md:text-[40px]">{collection.h1}</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-obsidian/70">
            {collection.intro ?? collection.description}
          </p>
          {collection.related && collection.related.length > 0 && (
            <RelatedLandings items={collection.related} />
          )}
        </div>
      </section>

      <section className="border-y border-black/5 bg-chalk">
        <div className="container-content flex items-center justify-between py-3 text-sm">
          <p className="text-obsidian/70">
            Показано {from}-{to} з {productCountLabel(total)}
          </p>
          <SortSelect />
        </div>
      </section>

      <section className="py-12">
        <div className="container-content flex flex-col gap-10 lg:flex-row">
          <FiltersPanel
            sizes={listing.facetSizes}
            lockedGender={collection.gender}
            hideGenderFilter={listing.selectedIsUnisex}
            lockedProductType={Boolean(collection.productTypeSlug) && !typeNavParent}
            typesAlwaysVisible={Boolean(collection.isAccessories) || Boolean(typeNavParent)}
            typeFilterLabel={collection.isAccessories ? "Тип" : "Категорія"}
            hideSizeFilter={Boolean(collection.isAccessories)}
            typeNavParent={typeNavParent}
            selectedTypeSlug={collection.productTypeSlug ?? listing.typeAllowed?.slug}
            productTypes={listing.productTypes}
          />
          <div className="flex-1">
            {products.length > 0 ? (
              <>
                <ProductGrid
                  products={products.map(toCardData)}
                  listId={collection.path}
                  listName={collection.name}
                />
                <Pagination page={page} totalPages={totalPages} />
              </>
            ) : (
              <div className="rounded-card bg-white p-16 text-center">
                <h3 className="font-display text-xl font-bold">Оновлюємо асортимент</h3>
                <p className="mt-2 text-sm text-obsidian/60">
                  Товари скоро зʼявляться — ми якраз наповнюємо каталог.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {collection.faq && collection.faq.length > 0 && (
        <CatalogFaq items={collection.faq} path={collection.path} />
      )}
    </>
  );
}
