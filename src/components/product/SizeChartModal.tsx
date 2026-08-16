"use client";

import { useEffect } from "react";
import { SIZE_CHART, formatHeightSize } from "@/lib/sizes";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Розміри, доступні на цьому товарі — підсвічуємо в таблиці */
  availableSizes?: string[];
};

export function SizeChartModal({ open, onClose, availableSizes }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const available = new Set(
    (availableSizes ?? []).map((s) => s.trim().toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-chart-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-obsidian/45 backdrop-blur-[2px]"
        aria-label="Закрити"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-xl sm:rounded-[24px]">
        <div className="flex items-start justify-between gap-4 border-b border-black/5 bg-mint/40 px-6 py-5 sm:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-obsidian/50">
              LUMI
            </p>
            <h2 id="size-chart-title" className="mt-1 font-display text-2xl font-black">
              Таблиця розмірів
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-obsidian/65">
              Орієнтуйтеся на <span className="font-semibold text-obsidian">ріст</span> — діти
              одного віку можуть сильно відрізнятися. Вік лише підказка.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-lg leading-none text-obsidian transition hover:border-cobalt hover:text-cobalt"
            aria-label="Закрити"
          >
            ×
          </button>
        </div>

        <div className="overflow-auto px-4 py-5 sm:px-8 sm:py-6">
          <div className="overflow-x-auto rounded-2xl border border-black/5">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-obsidian text-white">
                  <th className="px-4 py-3.5 font-semibold">Вік</th>
                  <th className="px-4 py-3.5 font-semibold">Ріст, діапазон</th>
                  <th className="px-4 py-3.5 font-semibold">Розмір LUMI</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_CHART.map((row, i) => {
                  const label = formatHeightSize(row.heightCm);
                  const inStock =
                    available.size === 0 || available.has(label.toLowerCase());
                  return (
                    <tr
                      key={row.age}
                      className={`border-t border-black/5 ${
                        i % 2 === 0 ? "bg-white" : "bg-chalk/80"
                      } ${inStock && available.size > 0 ? "font-medium" : ""}`}
                    >
                      <td className="px-4 py-3 text-obsidian/80">{row.age} років</td>
                      <td className="px-4 py-3 tabular-nums text-obsidian/70">
                        {row.heightRange} см
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-[13px] font-bold tabular-nums ${
                            inStock && available.size > 0
                              ? "bg-cobalt/10 text-cobalt"
                              : "bg-chalk text-obsidian"
                          }`}
                        >
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-5 text-[13px] leading-relaxed text-obsidian/55">
            Виробники також використовують кроки 5 і 10 см (наприклад 120, 130, 150). Якщо точного
            росту немає в товарі — оберіть найближчий більший.
          </p>
        </div>

        <div className="border-t border-black/5 px-6 py-4 sm:px-8">
          <button type="button" onClick={onClose} className="btn-primary w-full sm:w-auto">
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
}
