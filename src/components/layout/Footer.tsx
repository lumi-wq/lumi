import Link from "next/link";
import { Logo } from "./Logo";
import { InstagramIcon } from "@/components/Icons";

const COLUMNS = [
  {
    title: "Магазин",
    links: [
      { label: "Розпродаж", href: "/category/sale" },
      { label: "Весь одяг", href: "/category/teens" },
      { label: "Новинки", href: "/category/new" },
      { label: "Для підлітків", href: "/category/teens" },
      { label: "Аксесуари", href: "/search?q=аксесуари" },
    ],
  },
  {
    title: "Підтримка",
    links: [
      { label: "Доставка та повернення", href: "#" },
      { label: "Таблиця розмірів", href: "#" },
      { label: "Моє замовлення", href: "/profile" },
      { label: "Зв'язатися з нами", href: "#" },
      { label: "Наші магазини", href: "#" },
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
            Модний дитячий та підлітковий одяг з натуральних матеріалів. Зручно, стильно, якісно.
          </p>
          <div className="mt-6 flex gap-3">
            {[0, 1, 2].map((i) => (
              <a
                key={i}
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Соціальні мережі LUMI"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:text-white"
              >
                <InstagramIcon />
              </a>
            ))}
          </div>
        </div>
        <div className="grid gap-10 sm:grid-cols-2">
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
            <Link href="#" className="transition hover:text-white">Конфіденційність</Link>
            <Link href="#" className="transition hover:text-white">Умови</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
