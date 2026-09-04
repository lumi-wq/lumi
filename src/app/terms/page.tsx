import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection } from "@/components/legal/LegalDoc";
import {
  BRAND_ADDRESS,
  BRAND_EMAIL,
  BRAND_PHONE,
  BRAND_PHONE_DISPLAY,
  BRAND_TELEGRAM_URL,
  canonicalMetadata,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Умови користування та публічна оферта",
  description:
    "Публічна оферта інтернет-магазину LUMI: замовлення, оплата, доставка Новою Поштою, повернення та обмін.",
  ...canonicalMetadata("/terms"),
};

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="Документи"
      title="Умови користування"
      intro="Публічна оферта інтернет-магазину LUMI (lumi.kids). Оформлюючи замовлення, ви погоджуєтесь із цими умовами. Документ чинний з моменту публікації на сайті."
    >
      <LegalSection title="1. Продавець">
        <p>
          Продавець: фізична особа-підприємець{" "}
          <strong className="font-semibold text-obsidian">Георгіян Наталія Миколаївна</strong>, ІПН{" "}
          <strong className="font-semibold text-obsidian">2589317883</strong>. Адреса: {BRAND_ADDRESS}.
        </p>
        <p>
          Контакт:{" "}
          <a href={`mailto:${BRAND_EMAIL}`} className="font-medium text-cobalt underline-offset-2 hover:underline">
            {BRAND_EMAIL}
          </a>
          ,{" "}
          <a href={`tel:${BRAND_PHONE}`} className="font-medium text-cobalt underline-offset-2 hover:underline">
            {BRAND_PHONE_DISPLAY}
          </a>
          , Telegram:{" "}
          <a
            href={BRAND_TELEGRAM_URL}
            className="font-medium text-cobalt underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {BRAND_PHONE_DISPLAY}
          </a>
          . Сайт:{" "}
          <a href="https://lumi.kids/" className="font-medium text-cobalt underline-offset-2 hover:underline">
            https://lumi.kids/
          </a>
          .
        </p>
        <p>
          LUMI продає одяг і аксесуари для дітей (орієнтовно 6–16 років) у магазині за адресою{" "}
          {BRAND_ADDRESS} та дистанційно через інтернет-магазин lumi.kids.
        </p>
      </LegalSection>

      <LegalSection title="2. Акцепт оферти">
        <p>
          Ці умови є публічною пропозицією укласти договір купівлі-продажу. Акцептом (прийняттям)
          вважається оформлення замовлення на сайті та/або успішна онлайн-оплата.
        </p>
        <p>
          Замовлення можна оформити як гість або через акаунт (вхід за email і одноразовим кодом).
          Реєстрація не є обов’язковою.
        </p>
      </LegalSection>

      <LegalSection title="3. Ціни та наявність">
        <p>
          Ціни вказані в гривнях і включають податки, якщо інше прямо не зазначено. Вартість
          доставки розраховується окремо під час оформлення замовлення.
        </p>
        <p>
          Наявність розмірів і кольорів може змінюватися. Якщо товар закінчився після оформлення, ми
          зв’яжемося з вами для заміни, часткового виконання або повернення коштів.
        </p>
      </LegalSection>

      <LegalSection title="4. Оплата">
        <p>
          Оплата лише <strong className="font-semibold text-obsidian">карткою онлайн</strong> через
          платіжний сервіс plata by mono / Monobank (зокрема Visa, Mastercard, Apple Pay, Google
          Pay — за наявності в сервісі). Післяплата не передбачена.
        </p>
        <p>
          Замовлення вважається підтвердженим після успішної оплати (або іншої фіксації статусу
          «оплачено» платіжним сервісом).
        </p>
      </LegalSection>

      <LegalSection id="dostavka-ta-povernennya" title="5. Доставка">
        <p>
          Детальні умови — на сторінці{" "}
          <Link href="/delivery" className="font-medium text-cobalt underline-offset-2 hover:underline">
            Доставка
          </Link>
          .
        </p>
        <p>
          Доставка здійснюється службою <strong className="font-semibold text-obsidian">Нова Пошта</strong>{" "}
          у відділення або поштомат на території України. Кур’єрська доставка на адресу наразі не
          надається. Вартість — за тарифами перевізника, рахується під час оформлення і сплачується
          разом із замовленням.
        </p>
        <p>
          Орієнтовні строки прибуття показуються під час оформлення замовлення на підставі даних
          перевізника і можуть змінюватися. Після відправки ви отримуєте номер ТТН для відстеження.
        </p>
        <p>
          Отримувач зобов’язаний перевірити цілісність упаковки у відділенні / поштоматі. У разі
          пошкодження — оформити акт зі службою доставки та повідомити нас.
        </p>
      </LegalSection>

      <LegalSection id="povernennya-ta-obmin" title="6. Повернення та обмін">
        <p>
          Як оформити запит — на сторінці{" "}
          <Link href="/returns" className="font-medium text-cobalt underline-offset-2 hover:underline">
            Повернення та обмін
          </Link>
          .
        </p>
        <p>
          Відповідно до законодавства про захист прав споживачів, ви можете повернути або обміняти
          товар належної якості протягом{" "}
          <strong className="font-semibold text-obsidian">14 днів</strong> з моменту отримання, якщо
          товар не був у використанні, збережено товарний вигляд, ярлики та споживчі властивості, а
          також є підтвердження покупки.
        </p>
        <p>
          <strong className="font-semibold text-obsidian">Зворотну доставку</strong> при поверненні /
          обміні з нашої вини або за правилами повернення товару належної якості{" "}
          <strong className="font-semibold text-obsidian">оплачує LUMI</strong> (за попереднім
          погодженням способу відправки на{" "}
          <a href="mailto:lumi@lumi.kids" className="font-medium text-cobalt underline-offset-2 hover:underline">
            lumi@lumi.kids
          </a>
          ).
        </p>
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
          або інший дефект, якого не було на момент відправки з боку магазину, LUMI залишає за собою
          право відмовити у поверненні коштів (повністю або частково) та/або повернути товар
          покупцю за його рахунок.
        </p>
        <p>
          Товар з виробничим браком підлягає заміні або поверненню коштів після підтвердження
          недоліку. Напишіть на{" "}
          <a href="mailto:lumi@lumi.kids" className="font-medium text-cobalt underline-offset-2 hover:underline">
            lumi@lumi.kids
          </a>{" "}
          з номером замовлення та фото.
        </p>
      </LegalSection>

      <LegalSection title="7. Скасування замовлення">
        <p>
          До передачі посилки перевізнику ви можете звернутися щодо скасування. Після відправки
          діють правила{" "}
          <Link href="/returns" className="font-medium text-cobalt underline-offset-2 hover:underline">
            повернення
          </Link>
          . Повернення коштів за оплачене замовлення здійснюється
          тим самим способом оплати в строки, передбачені платіжним сервісом і законом.
        </p>
      </LegalSection>

      <LegalSection title="8. Інтелектуальна власність">
        <p>
          Назва LUMI, дизайн сайту, тексти та зображення товарів охороняються законом. Копіювання
          без письмового дозволу заборонене.
        </p>
      </LegalSection>

      <LegalSection title="9. Відповідальність">
        <p>
          Фото та описи товарів мають ознайомчий характер; відтінки кольору можуть трохи відрізнятися
          залежно від екрана. Ми не відповідаємо за затримки доставки з вини перевізника або через
          обставини непереборної сили.
        </p>
      </LegalSection>

      <LegalSection title="10. Персональні дані">
        <p>
          Обробка персональних даних регулюється{" "}
          <Link href="/privacy" className="font-medium text-cobalt underline-offset-2 hover:underline">
            Політикою конфіденційності
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Зміни умов">
        <p>
          Актуальна редакція завжди доступна на{" "}
          <span className="font-medium text-obsidian">lumi.kids/terms</span>. Умови застосовуються до
          замовлень, оформлених після публікації відповідної редакції.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
