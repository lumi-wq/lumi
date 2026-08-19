"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/ga";
import { CookieConsent } from "./CookieConsent";

function GaRouteListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.toString();
    trackPageView(search ? `${pathname}?${search}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

export function GaClient() {
  return (
    <>
      <Suspense fallback={null}>
        <GaRouteListener />
      </Suspense>
      <CookieConsent />
    </>
  );
}
