"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className="rounded-input border-2 border-cobalt px-6 py-2.5 text-[13px] font-bold uppercase tracking-wide text-cobalt transition hover:bg-cobalt hover:text-white"
    >
      Вийти
    </button>
  );
}
