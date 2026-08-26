# LUMI — інтернет-магазин дитячого та підліткового одягу

Повноцінний e-commerce для українського ринку: каталог з фільтрами, кошик, гостьовий checkout з
Новою Поштою, OTP-авторизація без пароля, профіль і адмін-панель.

## Стек

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **PostgreSQL + Prisma ORM** (локально — embedded PostgreSQL, без Docker)
- **Zustand** (кошик з localStorage) + **React Query** (серверні дані)
- **JWT-сесії** в httpOnly cookie (jose), email + 4-значний OTP код
- Абстракція оплати: **Monobank Acquiring / mock**
- **Нова Пошта API** (з моком довідників без ключа)

## Запуск

Проєкт містить локальний Node 22 у `.toolchain/node` (системний Node 14 застарий):

```bash
export PATH="$PWD/.toolchain/node/bin:$PATH"
```

1. **База даних** (перший термінал, лишається запущеною):

```bash
npm run db:start
```

2. **Схема та тестові дані** (одноразово):

```bash
npm run db:push
npm run db:seed
```

3. **Дев-сервер** (другий термінал):

```bash
npm run dev
```

Сайт: http://localhost:3000

## Тестові акаунти (вхід через /auth)

| Email | Роль |
|---|---|
| `admin@lumi.ua` | Адміністратор (`/admin`) |
| `lumi.customer@example.com` | Демо-клієнт зі знижкою 10%, замовленнями та обраним |

OTP-код у dev-режимі показується прямо на сторінці входу та в консолі сервера
(реальна відправка листів не налаштована — див. `src/lib/email.ts`).

## Оплата (plata by mono / Monobank)

Керується змінною `PAYMENT_PROVIDER` у `.env` / Vercel:

| Значення | Коли |
|---|---|
| `mock` | Локально / production до готовності рахунку |
| `monobank` | Тестовий або бойовий Monopay |

Потрібні змінні для Monopay:

- `MONOBANK_TOKEN` — тестовий з [api.monobank.ua](https://api.monobank.ua/) або бойовий з [web.monobank.ua](https://web.monobank.ua/)
- `NEXT_PUBLIC_SITE_URL` — публічний HTTPS (для webhook). Локально: URL тунелю (ngrok / cloudflared)

### Dev: як протестувати Monopay

1. Токен з [api.monobank.ua](https://api.monobank.ua/) → `MONOBANK_TOKEN`
2. `PAYMENT_PROVIDER=monobank`
3. Підняти тунель на порт 3000 і вказати його в `NEXT_PUBLIC_SITE_URL`
4. Перезапустити `npm run dev`, оформити замовлення → «Карткою онлайн»
5. Тестова картка: будь-який валідний за Луном номер (напр. `4242424242424242`), будь-яка дата/CVV  
   Apple/Google Pay на тестовому токені не показуються.

### Production checklist (коли буде ФОП-рахунок у mono)

1. Відкрити бізнес-рахунок у monobank і підключити **інтернет-еквайринг (plata by mono)**
2. Скопіювати **бойовий** токен з [web.monobank.ua](https://web.monobank.ua/)
3. У Vercel (Production env):
   - `PAYMENT_PROVIDER=monobank`
   - `MONOBANK_TOKEN=<бойовий токен>`
   - `NEXT_PUBLIC_SITE_URL=https://lumi.kids`
   - **не** ставити `MONOBANK_SKIP_WEBHOOK_VERIFY`
4. Redeploy / дочекатись деплою
5. Тестова оплата на мінімальну суму → перевірити success і статус у `/admin/orders`
6. (Окремо) підключити ПРРО / Checkbox для фіскальних чеків онлайн-оплат

Після зміни токена або URL — обовʼязково redeploy, щоб підхопились env.

### Тимчасово закрити замовлення

Checkout вимкнений, якщо `NEXT_PUBLIC_ORDERS_ENABLED` не дорівнює `true`.
На production залиште вимкненим, поки не готові оплата й процеси. Щоб відкрити:

```
NEXT_PUBLIC_ORDERS_ENABLED=true
```

Після зміни — redeploy.

## Google Analytics 4

E-commerce аналітика (перегляди товарів, кошик, checkout, джерела трафіку). Скрипти не вантажаться, доки немає ID.

1. Створіть ресурс GA4: [analytics.google.com](https://analytics.google.com/) → Admin → Create property (веб, URL `https://lumi.kids`)
2. Скопіюйте Measurement ID (`G-XXXXXXXX`)
3. У Vercel (Production env) і локальному `.env`:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX
```

4. Redeploy. У DebugView (локально `npm run dev`) події з’являються з `debug_mode`.
5. На сайті з’явиться банер згоди; без «Прийняти» Google не ставить аналітичні cookies (Consent Mode).

## Google Ads — конверсія «Додавання в кошик»

Тег Google Ads (`AW-…`) підвантажується разом із GA4. Фрагмент події **не** стоїть у `<head>`: конверсія йде лише коли відвідувач натискає «Додати в кошик» (картка або сторінка товару).

За замовчуванням у коді вже є `AW-18405988896` і `send_to` для цієї дії. Щоб перевизначити:

```
NEXT_PUBLIC_AW_CONVERSION_ID=AW-18405988896
NEXT_PUBLIC_AW_ADD_TO_CART=AW-18405988896/xxxx
```

Після деплою в Google Ads → Цілі → Додавання в кошик перевірте статус тега (може зайняти кілька годин). Без згоди в банері cookies конверсія не піде.

Адмін-панель (`/admin`) не трекається.

## Google Merchant Center

Товари з адмінки можна надсилати в Merchant Center через Merchant API (кожен колір × розмір — окрема пропозиція).

1. У Merchant Center створіть джерело даних типу **API** (назва на кшталт `LUMI website`).
2. У Google Cloud увімкніть **Merchant API**, створіть OAuth client (Desktop) і отримайте `refresh_token` зі scope `https://www.googleapis.com/auth/content`.
3. Додайте змінні в `.env` і **Vercel Production**:

```
GOOGLE_MERCHANT_ACCOUNT_ID=...
GOOGLE_MERCHANT_DATA_SOURCE_ID=...
GOOGLE_MERCHANT_FEED_LABEL=UA
GOOGLE_MERCHANT_CONTENT_LANGUAGE=uk
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REFRESH_TOKEN=...
```

4. Redeploy. У `/admin/products` з’явиться кнопка **Надіслати товари в Google**. Збереження або видалення товару також оновлює фіда.

Посилання та фото для Google завжди вказують на `https://lumi.kids`. Після синку обробка в Merchant Center може зайняти кілька хвилин.

## Нова Пошта (Україна)

Використовується **український** API: `https://api.novaposhta.ua/v2.0/json/`.

1. Кабінет: [new.novaposhta.ua](https://new.novaposhta.ua/) → **Налаштування → Безпека → Створити ключ**
2. Вставте ключ у `.env` як `NOVA_POSHTA_API_KEY`
3. Без ключа працює локальний мок міст/відділень і fallback-тариф

На checkout після вибору відділення рахуються:
- вартість доставки (`InternetDocument.getDocumentPrice`) з Сокирян
- орієнтовна дата (`getDocumentDeliveryDate`) з урахуванням графіка відправки LUMI

Вага: одяг 1 кг/од., сумки 2 кг, шапки/кепки/окуляри 0.5 кг.

### Вебхук статусів

URL для кабінету НП (коли DNS `lumi.kids` вказує на сервер):

```
https://lumi.kids/api/novaposhta/webhook
```

Адмін у `/admin/orders` вводить ТТН → статуси **Відправлено / Прибула / Отримано** оновлюються з вебхука або кнопкою «Оновити статус з НП».

## Telegram — сповіщення про оплачені замовлення

Після успішної оплати бот надсилає вам повідомлення зі складом (товар, колір, розмір, кількість), фото, ПІБ, телефон і відділення Нової Пошти.

1. У Telegram відкрийте [@BotFather](https://t.me/BotFather) → `/newbot` → скопіюйте токен.
2. У Vercel Production (або локальному `.env`):

```
TELEGRAM_BOT_TOKEN=123456:ABC...
```

3. Redeploy, зайдіть в `/admin` — сайт зареєструє webhook.
4. Для групи: додайте бота, зробіть його **адміністратором** і напишіть `/start`. Бот відповість `chat ID` (від’ємне число, напр. `-100123…`).
5. Додайте в Vercel:

```
TELEGRAM_CHAT_ID=-1001234567890
```

Кілька чатів — через кому.
6. Redeploy. У `/admin` натисніть **Надіслати тест**.

Без цих змінних сповіщення просто пропускаються; оплата клієнта не страждає.


## Структура

- `src/app` — сторінки (App Router) та API-роути
- `src/components` — UI-компоненти (layout, product, catalog, profile, admin)
- `src/lib` — Prisma, auth, оплата, Нова Пошта, форматування
- `src/store` — Zustand-стор кошика
- `prisma/` — схема БД та seed
- `scripts/db.mjs` — запуск embedded PostgreSQL (порт 5433, дані в `.pgdata`)
