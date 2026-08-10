"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchIcon } from "@/components/Icons";

export function SearchBanner({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(value.trim() ? `/search?q=${encodeURIComponent(value.trim())}` : "/search");
      }}
      className="mt-4 flex items-center gap-3 rounded-full border-2 border-cobalt bg-white px-6 py-4"
    >
      <SearchIcon className="h-5 w-5 text-cobalt" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Пошук..."
        autoFocus
        className="w-full bg-transparent text-lg outline-none placeholder:text-[#999]"
        aria-label="Пошук товарів"
      />
    </form>
  );
}
