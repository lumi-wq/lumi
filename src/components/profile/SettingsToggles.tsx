"use client";

import { useState } from "react";

type Settings = { newsletter: boolean; deliveryNotifications: boolean };

const OPTIONS: { key: keyof Settings; title: string; hint: string }[] = [
  {
    key: "newsletter",
    title: "Отримувати розсилки",
    hint: "Бути в курсі нових надходжень та ексклюзивних знижок",
  },
  {
    key: "deliveryNotifications",
    title: "Сповіщення про доставку",
    hint: "Надсилати SMS та повідомлення про статус замовлення",
  },
];

export function SettingsToggles({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);

  const toggle = async (key: keyof Settings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    }).catch(() => setSettings(settings));
  };

  return (
    <div className="mt-5 divide-y divide-black/5 rounded-card border border-black/5 bg-chalk px-6">
      {OPTIONS.map((option) => (
        <div key={option.key} className="flex items-center justify-between gap-4 py-5">
          <div>
            <p className="text-sm font-bold">{option.title}</p>
            <p className="mt-1 text-[13px] text-obsidian/60">{option.hint}</p>
          </div>
          <button
            role="switch"
            aria-checked={settings[option.key]}
            aria-label={option.title}
            onClick={() => toggle(option.key)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              settings[option.key] ? "bg-cobalt" : "bg-black/15"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                settings[option.key] ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
