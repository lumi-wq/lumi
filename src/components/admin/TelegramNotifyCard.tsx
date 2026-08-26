"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

type Status = {
  configured: boolean;
  hasToken: boolean;
  chatCount: number;
};

export function TelegramNotifyCard() {
  const { data } = useQuery<Status>({
    queryKey: ["admin-telegram"],
    queryFn: async () => {
      const res = await fetch("/api/admin/telegram");
      if (!res.ok) throw new Error("Не вдалося перевірити Telegram");
      return res.json();
    },
  });

  const test = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/telegram", { method: "POST" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error || "Не вдалося надіслати");
    },
  });

  return (
    <div className="mt-8 rounded-card bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-black">Telegram</h2>
          <p className="mt-1 text-sm text-obsidian/60">
            Сповіщення про оплачені замовлення — склад, отримувач, відділення НП.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
            data?.configured ? "bg-mint text-obsidian" : "bg-chalk text-obsidian/60"
          }`}
        >
          {data?.configured ? "підключено" : "не налаштовано"}
        </span>
      </div>

      {!data?.configured && (
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-obsidian/75">
          <li>
            У Telegram відкрийте{" "}
            <a
              href="https://t.me/BotFather"
              className="font-semibold text-cobalt underline"
              target="_blank"
              rel="noreferrer"
            >
              @BotFather
            </a>{" "}
            → /newbot → скопіюйте токен у <code className="font-mono text-[12px]">TELEGRAM_BOT_TOKEN</code>
          </li>
          <li>
            Відкрийте бота й натисніть Start, або в групі зробіть його адміністратором і напишіть{" "}
            <code className="font-mono text-[12px]">/start</code> — він відповість chat ID
          </li>
          <li>
            Додайте <code className="font-mono text-[12px]">TELEGRAM_CHAT_ID</code> у Vercel Production і зробіть
            redeploy
          </li>
        </ol>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!data?.configured || test.isPending}
          onClick={() => test.mutate()}
          className="btn-primary py-2.5 text-[12px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {test.isPending ? "Надсилаю…" : "Надіслати тест"}
        </button>
        {test.isSuccess && <p className="text-sm text-obsidian/60">Перевірте чат з ботом.</p>}
        {test.isError && (
          <p className="text-sm text-red-600">
            {test.error instanceof Error ? test.error.message : "Помилка"}
          </p>
        )}
        {data?.hasToken && !data.configured && (
          <p className="text-sm text-obsidian/50">Токен уже є, бракує TELEGRAM_CHAT_ID.</p>
        )}
      </div>
    </div>
  );
}
