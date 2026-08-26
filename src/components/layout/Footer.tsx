import Link from "next/link";
import { Logo } from "./Logo";
import { FooterContacts } from "./StoreContacts";
import { CookieSettingsButton } from "@/components/analytics/CookieSettingsButton";

const COLUMNS = [
  {
    title: "Магазин",
    links: [
      { label: "Розпродаж", href: "/category/sale" },
      { label: "Новинки", href: "/category/new" },
      { label: "Дівчатка", href: "/category/girls" },
      { label: "Хлопчики", href: "/category/boys" },
      { label: "Аксесуари", href: "/category/accessories" },
    ],
  },
  {
    title: "Каталог",
    links: [
      { label: "Верхній одяг", href: "/category/verkhniy-odyag" },
      { label: "Шкільний одяг", href: "/category/shkilnyy-odyag" },
      { label: "Підлітковий одяг", href: "/category/pidlitkovyy-odyag" },
      { label: "Зимовий одяг", href: "/category/zymovyy-odyag" },
      { label: "Таблиця розмірів", href: "/size-guide" },
    ],
  },
  {
    title: "Підтримка",
    links: [
      { label: "Контакти", href: "/contacts" },
      { label: "Доставка", href: "/delivery" },
      { label: "Повернення", href: "/returns" },
      { label: "Відслідкувати замовлення", href: "/orders" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-obsidian text-white">
      <div className="container-content grid gap-12 py-16 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Logo dark />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
            Стильний одяг для дітей 6–16 років з натуральних матеріалів. Зручно, стильно, якісно.
          </p>
          <FooterContacts />
        </div>
          <div className="grid gap-10 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-bold uppercase tracking-wide">{col.title}</h4>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/70 transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-content flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/50 sm:flex-row">
          <p>© 2026 LUMI. Усі права захищені.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition hover:text-white">
              Конфіденційність
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Умови
            </Link>
            <CookieSettingsButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
