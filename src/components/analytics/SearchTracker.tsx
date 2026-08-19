"use client";

import { useEffect } from "react";
import { trackSearch } from "@/lib/ga";

export function SearchTracker({ query }: { query: string }) {
  useEffect(() => {
    const term = query.trim();
    if (term) trackSearch(term);
  }, [query]);

  return null;
}
