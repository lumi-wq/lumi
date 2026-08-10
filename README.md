# LUMI — інтернет-магазин дитячого та підліткового одягу

Повноцінний e-commerce для українського ринку: каталог з фільтрами, кошик, гостьовий checkout з
Новою Поштою, OTP-авторизація без пароля, профіль з програмою лояльності LUMI CLUB та адмін-панель.

## Стек

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **PostgreSQL + Prisma ORM** (локально — embedded PostgreSQL, без Docker)
- **Zustand** (кошик з localStorage) + **React Query** (серверні дані)
- **JWT-сесії** в httpOnly cookie (jose), email + 4-значний OTP код
- Абстракція оплати: **LiqPay / Monobank Acquiring / mock**
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

## Промокоди

- `LUMILIGHT` — 10%
- `LUMI20` — 20%

Безкоштовна доставка від 1 500 ₴.

## Оплата

Керується змінною `PAYMENT_PROVIDER` у `.env`:

- `mock` (за замовчуванням) — одразу «оплачує» замовлення і веде на сторінку успіху
- `liqpay` — потрібні `LIQPAY_PUBLIC_KEY` / `LIQPAY_PRIVATE_KEY`
- `monobank` — потрібен `MONOBANK_TOKEN`

## Нова Пошта (Україна)

Використовується **український** API: `https://api.novaposhta.ua/v2.0/json/`.

1. Кабінет: [new.novaposhta.ua](https://new.novaposhta.ua/) → **Налаштування → Безпека → Створити ключ**
2. Вставте ключ у `.env` як `NOVA_POSHTA_API_KEY`
3. Без ключа працює локальний мок міст/відділень

### Вебхук статусів

URL для кабінету НП (коли DNS `lumi.kids` вказує на сервер):

```
https://lumi.kids/api/novaposhta/webhook
```

Адмін у `/admin/orders` вводить ТТН → статуси **Відправлено / Прибула / Отримано** оновлюються з вебхука або кнопкою «Оновити статус з НП».


## Структура

- `src/app` — сторінки (App Router) та API-роути
- `src/components` — UI-компоненти (layout, product, catalog, profile, admin)
- `src/lib` — Prisma, auth, оплата, Нова Пошта, форматування
- `src/store` — Zustand-стор кошика
- `prisma/` — схема БД та seed
- `scripts/db.mjs` — запуск embedded PostgreSQL (порт 5433, дані в `.pgdata`)
