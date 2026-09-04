import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection } from "@/components/legal/LegalDoc";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  BRAND_ADDRESS,
  BRAND_EMAIL,
  BRAND_PHONE,
  BRAND_PHONE_DISPLAY,
  BRAND_TELEGRAM_URL,
  canonicalMetadata,
} from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Доставка Новою Поштою по Україні",
  description:
    "Доставка LUMI: Нова Пошта у відділення або поштомат, вартість за тарифами перевізника на чекауті, строки відправки з Сокирян.",
  ...canonicalMetadata("/delivery"),
};

export default function DeliveryPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Доставка", item: absoluteUrl("/delivery") },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <LegalDoc
        eyebrow="Підтримка"
        title="Доставка"
        intro="Доставляємо замовлення Новою Поштою по Україні. Вартість і орієнтовна дата прибуття рахуються під час оформлення — після вибору відділення або поштомату."
      >
        <LegalSection title="Куди доставляємо">
          <p>
            Служба доставки —{" "}
            <strong className="font-semibold text-obsidian">Нова Пошта</strong>. Відправка у
            відділення або поштомат на території України.
          </p>
          <p>Кур’єрська доставка на домашню адресу наразі не надається. Міжнародної доставки немає.</p>
          <p>
            Замовлення з сайту відправляємо Новою Поштою з Сокирян: {BRAND_ADDRESS}. За цією адресою
            також працює магазин — товари можна купити на місці.
          </p>
        </LegalSection>

        <LegalSection title="Вартість">
          <p>
            Доставку оплачує покупець{" "}
            <strong className="font-semibold text-obsidian">разом із замовленням карткою онлайн</strong>
            . Післяплати немає.
          </p>
          <p>
            Сума — за тарифами Нової Пошти: залежить від ваги посилки та міста отримання. Точну
            вартість видно на чекауті після вибору відділення або поштомату.
          </p>
        </LegalSection>

        <LegalSection title="Коли відправляємо">
          <p>Замовлення, оплачене в робочі години, відправляємо з Сокирян у той самий день:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>будні — до 16:00 (час Києва);</li>
            <li>субота — до 14:00.</li>
          </ul>
          <p>
            Пізніше, у неділю або в святковий день — наступного робочого дня. Орієнтовна дата
            прибуття показується під час оформлення за даними перевізника і може змінитися.
          </p>
        </LegalSection>

        <LegalSection title="Відстеження">
          <p>
            Після відправки надсилаємо номер ТТН. Статус і накладну можна перевірити на{" "}
            <Link href="/orders" className="font-medium text-cobalt underline-offset-2 hover:underline">
              сторінці замовлення
            </Link>{" "}
            за номером і телефоном — без реєстрації.
          </p>
        </LegalSection>

        <LegalSection title="Отримання">
          <p>
            Перевірте цілісність упаковки у відділенні або біля поштомату. Якщо є пошкодження —
            оформте акт зі службою доставки і напишіть нам.
          </p>
          <p>
            Питання щодо доставки:{" "}
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
            </a>
            {" "}або{" "}
            <a
              href={BRAND_TELEGRAM_URL}
              className="font-medium text-cobalt underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Telegram
            </a>
            .
          </p>
        </LegalSection>

        <p className="text-sm text-obsidian/55">
          Повернення та обмін — на сторінці{" "}
          <Link href="/returns" className="font-medium text-cobalt underline-offset-2 hover:underline">
            Повернення
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
