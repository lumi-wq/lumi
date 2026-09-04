import type { Metadata } from "next";
import { STORE_CONTACTS } from "@/components/layout/StoreContacts";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  BRAND,
  BRAND_COUNTRY,
  BRAND_EMAIL,
  BRAND_LOCALITY,
  BRAND_PHONE,
  BRAND_POSTAL_CODE,
  BRAND_REGION,
  BRAND_STREET,
  BRAND_TELEGRAM_URL,
  canonicalMetadata,
} from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Телефон, email, Telegram і адреса магазину LUMI в Сокирянах. Доставка Новою Поштою по Україні.",
  ...canonicalMetadata("/contacts"),
};

export default function ContactsPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Контакти", item: absoluteUrl("/contacts") },
    ],
  };

  const contactLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Контакти ${BRAND}`,
    url: absoluteUrl("/contacts"),
    inLanguage: "uk-UA",
    mainEntity: {
      "@type": "ClothingStore",
      name: BRAND,
      email: BRAND_EMAIL,
      telephone: BRAND_PHONE,
      url: absoluteUrl("/"),
      address: {
        "@type": "PostalAddress",
        streetAddress: BRAND_STREET,
        addressLocality: BRAND_LOCALITY,
        postalCode: BRAND_POSTAL_CODE,
        addressRegion: BRAND_REGION,
        addressCountry: BRAND_COUNTRY,
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: BRAND_PHONE,
        email: BRAND_EMAIL,
        contactType: "customer service",
        areaServed: "UA",
        availableLanguage: ["uk"],
        url: BRAND_TELEGRAM_URL,
      },
    },
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={contactLd} />
      <section className="bg-white">
        <div className="container-content py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/50">
            Підтримка
          </p>
          <h1 className="mt-3 font-display text-3xl font-black md:text-[40px]">Контакти</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-obsidian/70">
            Напишіть, зателефонуйте або завітайте до магазину в Сокирянах — допоможемо з розміром,
            замовленням і доставкою. Відповідаємо українською протягом робочого дня.
          </p>
        </div>
      </section>

      <section className="border-t border-black/5 bg-chalk py-12">
        <div className="container-content">
          <ul className="grid gap-4 sm:grid-cols-2">
            {STORE_CONTACTS.map(({ label, value, href, Icon, ...rest }) => {
              const external = "external" in rest && rest.external;
              const body = (
                <>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-obsidian/45">
                      {label}
                    </span>
                    <span className="mt-1 block text-[15px] font-medium leading-relaxed text-obsidian">
                      {value}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={label}>
                  {href ? (
                    <a
                      href={href}
                      className="flex items-start gap-4 rounded-2xl border border-black/5 bg-white p-6 transition hover:border-cobalt/30"
                      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="flex items-start gap-4 rounded-2xl border border-black/5 bg-white p-6">
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-obsidian/55">
            За цією адресою працює магазин LUMI — товари можна купити на місці. Замовлення з сайту
            відправляємо Новою Поштою по Україні.
          </p>
        </div>
      </section>
    </>
  );
}
