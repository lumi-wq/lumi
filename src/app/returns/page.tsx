import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection } from "@/components/legal/LegalDoc";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  BRAND_EMAIL,
  BRAND_PHONE,
  BRAND_PHONE_DISPLAY,
  BRAND_TELEGRAM_URL,
  canonicalMetadata,
} from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Повернення та обмін",
  description:
    "Повернення й обмін в LUMI протягом 14 днів. Зворотну доставку Новою Поштою оплачує магазин. Як оформити запит і коли повертаємо кошти.",
  ...canonicalMetadata("/returns"),
};

function ContactLinks() {
  return (
    <>
      <a
        href={`mailto:${BRAND_EMAIL}`}
        className="font-medium text-cobalt underline-offset-2 hover:underline"
      >
        {BRAND_EMAIL}
      </a>
      ,{" "}
      <a
        href={`tel:${BRAND_PHONE}`}
        className="font-medium text-cobalt underline-offset-2 hover:underline"
      >
        {BRAND_PHONE_DISPLAY}
      </a>{" "}
      або{" "}
      <a
        href={BRAND_TELEGRAM_URL}
        className="font-medium text-cobalt underline-offset-2 hover:underline"
        target="_blank"
        rel="noreferrer"
      >
        Telegram
      </a>
    </>
  );
}

export default function ReturnsPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Повернення", item: absoluteUrl("/returns") },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <LegalDoc
        eyebrow="Підтримка"
        title="Повернення та обмін"
        intro="Товар належної якості можна повернути або обміняти протягом 14 днів з моменту отримання. Зворотну доставку Новою Поштою оплачує LUMI — після погодження способу відправки."
      >
        <LegalSection title="Строк">
          <p>
            Відповідно до законодавства про захист прав споживачів —{" "}
            <strong className="font-semibold text-obsidian">14 днів</strong> з дня отримання, якщо
            товар не був у використанні, збережено товарний вигляд, ярлики, споживчі властивості та
            є підтвердження покупки (номер замовлення).
          </p>
        </LegalSection>

        <LegalSection title="Як оформити">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Напишіть нам на <ContactLinks /> з номером замовлення і причиною (повернення чи
              обмін, розмір / колір).
            </li>
            <li>Погодьте відділення Нової Пошти для зворотної відправки — її оплачує LUMI.</li>
            <li>Упакуйте річ так, як отримали: з ярликами, без слідів носіння.</li>
            <li>Після отримання й перевірки повернемо кошти або відправимо обмін.</li>
          </ol>
        </LegalSection>

        <LegalSection title="Хто платить доставку">
          <p>
            <strong className="font-semibold text-obsidian">Зворотну доставку оплачує LUMI</strong>{" "}
            при поверненні / обміні товару належної якості та якщо помилка з нашого боку. Не
            відправляйте посилку за свій рахунок без попереднього погодження.
          </p>
        </LegalSection>

        <LegalSection title="Що не повертаємо">
          <p>Не підлягають поверненню / обміну з підстав «не підійшов / передумав», зокрема:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>шкарпетки, колготки та подібні вироби;</li>
            <li>труси та інша спідня білизна;</li>
            <li>інші товари, повернення яких обмежене законодавством із гігієнічних міркувань.</li>
          </ul>
          <p>
            Якщо після повернення виявлено{" "}
            <strong className="font-semibold text-obsidian">
              сліди використання, пошкодження, відсутність комплектуючих / ярликів
            </strong>{" "}
            або інший дефект, якого не було на момент відправки, можемо відмовити у поверненні коштів
            (повністю або частково) і повернути товар за ваш рахунок.
          </p>
        </LegalSection>

        <LegalSection title="Брак і пошкодження">
          <p>
            Товар з виробничим браком або пошкоджений у дорозі підлягає заміні або поверненню коштів
            після підтвердження. Надішліть номер замовлення і фото на <ContactLinks />.
          </p>
        </LegalSection>

        <LegalSection title="Скасування і повернення коштів">
          <p>
            До передачі посилки перевізнику можна скасувати замовлення через ті самі контакти. Після
            відправки діють правила повернення вище.
          </p>
          <p>
            Кошти за оплачене замовлення повертаємо{" "}
            <strong className="font-semibold text-obsidian">тим самим способом оплати</strong> в
            строки платіжного сервісу (plata by mono / Monobank) і закону. Комісію банку ми не
            утримуємо.
          </p>
        </LegalSection>

        <p className="text-sm text-obsidian/55">
          Правила доставки — на сторінці{" "}
          <Link href="/delivery" className="font-medium text-cobalt underline-offset-2 hover:underline">
            Доставка
          </Link>
          . Повна оферта — в{" "}
          <Link href="/terms" className="font-medium text-cobalt underline-offset-2 hover:underline">
            умовах користування
          </Link>
          .
        </p>
      </LegalDoc>
    </>
  );
}
