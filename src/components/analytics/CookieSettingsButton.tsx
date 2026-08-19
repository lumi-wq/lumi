"use client";

import { openConsentBanner, isGaEnabled } from "@/lib/ga";

export function CookieSettingsButton() {
  if (!isGaEnabled()) return null;
  return (
    <button
      type="button"
      onClick={openConsentBanner}
      className="transition hover:text-white"
    >
      Cookies
    </button>
  );
}
