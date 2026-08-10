"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCart } from "@/store/cart";

export default function AuthPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [step, setStep] = useState<1 | 2>(1);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Помилка");
      setStep(2);
      setDevCode(json.devCode ?? null);
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const setDigit = (i: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < 3) inputsRef.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = digits.join("");
    if (code.length !== 4) {
      setError("Введіть 4 цифри коду");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Помилка");
      // Синхронізуємо гостьовий кошик із сервером
      if (items.length > 0) {
        await fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ variantId: i.variantId, quantity: i.qty })),
          }),
        }).catch(() => {});
      }
      router.push(json.user.isAdmin ? "/admin" : "/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center px-5 py-20">
      <div className="w-full max-w-[480px] rounded-card bg-white p-8 shadow-sm md:p-12">
        <h1 className="text-center font-display text-[28px] font-black leading-tight">
          Увійдіть або створіть аккаунт
        </h1>
        <p className="mt-4 text-center text-sm leading-relaxed text-obsidian/60">
          Реєстрація не потрібна для покупок, але з обліковим записом ви отримаєте накопичувальні
          знижки та зможете відстежувати ваші замовлення.
        </p>

        <form onSubmit={requestCode} className="mt-8">
          <label className="text-xs font-bold uppercase tracking-wide text-cobalt">
            Крок 1: Введіть ваш email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="lumi.customer@example.com"
            className="input-base mt-2.5"
          />
          <button type="submit" disabled={loading || !email.trim()} className="btn-primary mt-4 w-full">
            {loading && step === 1 ? "Надсилаємо..." : "Отримати код на пошту"}
          </button>
        </form>

        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-black/10" />
          <span className="text-xs font-semibold text-obsidian/50">АБО</span>
          <span className="h-px flex-1 bg-black/10" />
        </div>

        <form onSubmit={verify}>
          <label className="text-xs font-bold uppercase tracking-wide text-obsidian/60">
            Крок 2: Введіть 4-значний код
          </label>
          {devCode && (
            <p className="mt-2 rounded-lg bg-mint px-3 py-2 text-xs text-obsidian/70">
              Dev-режим: ваш код — <b className="font-display text-sm">{devCode}</b> (також у консолі
              сервера)
            </p>
          )}
          <div className="mt-3 flex justify-center gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                inputMode="numeric"
                maxLength={2}
                disabled={step === 1}
                className="h-16 w-16 rounded-input border-[1.5px] border-[#E0E0E0] text-center font-display text-2xl font-extrabold outline-none transition focus:border-cobalt disabled:bg-chalk"
                aria-label={`Цифра ${i + 1}`}
              />
            ))}
          </div>
          {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || step === 1}
            className={`mt-5 w-full ${step === 2 ? "btn-primary" : "btn-dark"}`}
          >
            {loading && step === 2 ? "Перевіряємо..." : "Підтвердити та увійти"}
          </button>
        </form>

        <div className="mt-7 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-cobalt underline underline-offset-4"
          >
            Продовжити без реєстрації
          </Link>
        </div>
      </div>
    </div>
  );
}
