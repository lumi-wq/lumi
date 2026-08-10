"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <p className="mt-8 text-[15px] font-semibold text-cobalt">
        Дякуємо! Перевірте пошту — там на вас чекає знижка 10%.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Ваш email..."
        className="input-base flex-1"
        aria-label="Email для розсилки"
      />
      <button type="submit" disabled={status === "loading"} className="btn-dark shrink-0">
        {status === "loading" ? "..." : "Підписатися"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600 sm:hidden">Щось пішло не так, спробуйте ще раз.</p>
      )}
    </form>
  );
}
