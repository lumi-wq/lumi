import type { Metadata } from "next";
import { LegalDoc, LegalSection } from "@/components/legal/LegalDoc";
import { canonicalMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Політика конфіденційності",
  description: "Як інтернет-магазин LUMI збирає, використовує та захищає персональні дані.",
  ...canonicalMetadata("/privacy"),
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="Документи"
      title="Політика конфіденційності"
      intro="Ця політика пояснює, які дані ми збираємо під час користування сайтом lumi.kids, навіщо вони потрібні та як їх захищаємо. Чинна з моменту публікації на сайті."
    >
      <LegalSection title="1. Хто відповідає за дані">
        <p>
          Оператором персональних даних є фізична особа-підприємець{" "}
          <strong className="font-semibold text-obsidian">Георгіян Наталія Миколаївна</strong>, ІПН{" "}
          <strong className="font-semibold text-obsidian">2589317883</strong>, м. Сокиряни,
          Чернівецька обл. (далі — «LUMI», «ми»).
        </p>
        <p>
          Контакт для звернень щодо персональних даних:{" "}
          <a href="mailto:lumi@lumi.kids" className="font-medium text-cobalt underline-offset-2 hover:underline">
            lumi@lumi.kids
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Які дані ми збираємо">
        <p>Залежно від того, як ви користуєтесь сайтом, ми можемо отримувати:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>ім’я та прізвище, номер телефону, email;</li>
          <li>дані для доставки: місто, відділення або поштомат Нової Пошти;</li>
          <li>склад замовлення, суми, статус оплати та доставки, номер ТТН;</li>
          <li>дані акаунта (email) і коди підтвердження (OTP) під час входу;</li>
          <li>список обраного (wishlist) для гостя або авторизованого користувача;</li>
          <li>
            технічні дані, потрібні для роботи сайту: cookie сесії / гостя, дані кошика в
            localStorage браузера;
          </li>
          <li>
            дані аналітики (за вашою згодою): сторінки, які ви відкриваєте, кліки по категоріях і
            товарах, орієнтовний час на сайті, пристрій, місто приблизно, звідки ви перейшли на
            сайт. Ці дані збирає Google Analytics і не містять вашого імені, телефону чи email.
          </li>
        </ul>
        <p>
          Платіжні дані картки обробляє платіжний сервіс (plata by mono / Monobank). Ми не зберігаємо
          повний номер картки, CVV чи дані Apple Pay / Google Pay на своїх серверах.
        </p>
      </LegalSection>

      <LegalSection title="3. Навіщо нам ці дані">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>оформити, оплатити та доставити замовлення;</li>
          <li>ідентифікувати вас при вході в акаунт і перегляді замовлень;</li>
          <li>зв’язатися з вами щодо замовлення (уточнення, статус, повернення);</li>
          <li>зберегти кошик / обране на вашому пристрої;</li>
          <li>зрозуміти, як користуються сайтом (популярні категорії, товари, джерела трафіку) — лише якщо ви прийняли аналітичні cookies;</li>
          <li>виконувати вимоги законодавства щодо обліку продажів.</li>
        </ul>
        <p>Ми не продаємо персональні дані третім особам і не використовуємо їх для розсилок без окремої згоди, якщо така функція з’явиться пізніше.</p>
      </LegalSection>

      <LegalSection title="4. Cookies та локальне зберігання">
        <p>На сайті використовуються такі засоби:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="font-semibold text-obsidian">сесійний cookie</strong> — після входу за
            email і OTP;
          </li>
          <li>
            <strong className="font-semibold text-obsidian">гостьовий cookie</strong> — щоб зберегти
            wishlist і прив’язати замовлення з цього пристрою;
          </li>
          <li>
            <strong className="font-semibold text-obsidian">cookie доступу до замовлення</strong> —
            після перевірки номера телефону для перегляду статусу;
          </li>
          <li>
            <strong className="font-semibold text-obsidian">localStorage</strong> — кошик у браузері;
          </li>
          <li>
            <strong className="font-semibold text-obsidian">аналітичні cookies Google Analytics</strong>{" "}
            — лише після натискання «Прийняти» в банері. Вони допомагають бачити відвідуваність,
            джерела трафіку та які товари дивляться. Ви можете відхилити аналітику або змінити вибір
            у підвалі сайту («Cookies»).
          </li>
        </ul>
        <p>
          Необхідні cookies потрібні для роботи магазину (кошик, сесія, гість). Якщо ви очистите
          cookies / дані сайту, частина функцій може скинутися, а вибір щодо аналітики буде
          запропоновано знову.
        </p>
      </LegalSection>

      <LegalSection title="5. Передача даних третім сторонам">
        <p>Дані можуть передаватися третім сторонам у такому обсязі:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="font-semibold text-obsidian">Нова Пошта</strong> — для доставки
            (ПІБ, телефон, місто, відділення / поштомат);
          </li>
          <li>
            <strong className="font-semibold text-obsidian">plata by mono / Monobank</strong> — для
            онлайн-оплати;
          </li>
          <li>
            <strong className="font-semibold text-obsidian">Google LLC (Google Analytics)</strong> — якщо
            ви прийняли аналітичні cookies: дані про перегляди сторінок, події в каталозі та
            джерела трафіку. Google може обробляти їх на серверах за межами України відповідно до
            своєї{" "}
            <a
              href="https://policies.google.com/privacy"
              className="font-medium text-cobalt underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              політики конфіденційності
            </a>
            .
          </li>
          <li>постачальники хостингу, бази даних та інфраструктури сайту — для технічної роботи сервісу.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Зберігання та захист">
        <p>
          Дані замовлень і акаунта зберігаються стільки, скільки потрібно для виконання договору,
          гарантійних / претензійних строків і вимог закону. Технічний доступ обмежений; з’єднання з
          сайтом захищається через HTTPS.
        </p>
      </LegalSection>

      <LegalSection title="7. Ваші права">
        <p>
          Ви можете звернутися на{" "}
          <a href="mailto:lumi@lumi.kids" className="font-medium text-cobalt underline-offset-2 hover:underline">
            lumi@lumi.kids
          </a>{" "}
          із запитом щодо доступу, виправлення або видалення даних (якщо це не суперечить обов’язку
          зберігати первинні документи / історію замовлень). Ми відповімо в розумний строк.
        </p>
      </LegalSection>

      <LegalSection title="8. Зміни політики">
        <p>
          Ми можемо оновлювати цю політику. Актуальна версія завжди доступна на сторінці{" "}
          <span className="font-medium text-obsidian">lumi.kids/privacy</span>. Продовження
          користування сайтом після оновлення означає ознайомлення з новою редакцією.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
