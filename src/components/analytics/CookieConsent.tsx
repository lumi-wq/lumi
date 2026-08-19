"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  GA_OPEN_CONSENT_EVENT,
  isAdminPath,
  readConsent,
  updateAnalyticsConsent,
} from "@/lib/ga";

export function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAdminPath(pathname)) {
      setVisible(false);
      return;
    }
    setVisible(readConsent() == null);

    const onOpen = () => setVisible(true);
    window.addEventListener(GA_OPEN_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(GA_OPEN_CONSENT_EVENT, onOpen);
  }, [pathname]);

  if (!visible || isAdminPath(pathname)) return null;

  const choose = (granted: boolean) => {
    updateAnalyticsConsent(granted);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] p-4 md:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-card bg-white p-5 shadow-lg ring-1 ring-black/5 md:flex-row md:items-center md:p-6">
        <p className="flex-1 text-sm leading-relaxed text-obsidian/80">
          Щоб розуміти, які сторінки й товари переглядають відвідувачі, ми використовуємо Google
          Analytics. Детальніше — у{" "}
          <Link href="/privacy" className="font-semibold text-cobalt underline underline-offset-2">
            політиці конфіденційності
          </Link>
          .
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => choose(false)} className="btn-secondary px-5 py-3">
            Відхилити
          </button>
          <button type="button" onClick={() => choose(true)} className="btn-primary px-5 py-3">
            Прийняти
          </button>
        </div>
      </div>
    </div>
  );
}
