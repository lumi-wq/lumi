"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { normalizeHex } from "@/lib/color";

type Props = {
  images: string[];
  colors: string[];
  onChangeColors: (hexes: string[]) => void;
  /** Один колір з фото — без ручного вибору */
  mode?: "single" | "multi";
};

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export function ImageColorPicker({ images, colors, onChangeColors, mode = "multi" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [picking, setPicking] = useState(mode === "single");
  const [hoverHex, setHoverHex] = useState<string | null>(null);

  const src = images[activeImage] ?? null;
  const single = mode === "single";

  const sampleAt = useCallback(
    async (clientX: number, clientY: number, imgEl: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = imgEl.getBoundingClientRect();
      const x = Math.floor(((clientX - rect.left) / rect.width) * imgEl.naturalWidth);
      const y = Math.floor(((clientY - rect.top) / rect.height) * imgEl.naturalHeight);
      canvas.width = imgEl.naturalWidth;
      canvas.height = imgEl.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(imgEl, 0, 0);
      const pixel = ctx.getImageData(
        Math.max(0, Math.min(imgEl.naturalWidth - 1, x)),
        Math.max(0, Math.min(imgEl.naturalHeight - 1, y)),
        1,
        1
      ).data;
      return rgbToHex(pixel[0], pixel[1], pixel[2]);
    },
    []
  );

  const applyColor = (hex: string) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    if (single) {
      onChangeColors([normalized]);
      return;
    }
    if (colors.includes(normalized)) return;
    onChangeColors([...colors, normalized]);
  };

  const removeColor = (hex: string) => {
    onChangeColors(colors.filter((c) => c !== hex));
  };

  if (images.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/10 bg-chalk px-4 py-6 text-sm text-obsidian/60">
        Спочатку завантажте фото — потім клікніть по тканині, щоб взяти колір.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" aria-hidden />
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveImage(i)}
              className={`relative h-14 w-14 overflow-hidden rounded-lg border ${
                i === activeImage ? "border-cobalt ring-2 ring-cobalt/30" : "border-black/10"
              }`}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
                unoptimized={url.startsWith("blob:")}
              />
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-card border border-black/10 bg-chalk">
        <p className="border-b border-black/5 px-4 py-2 text-xs text-obsidian/60">
          {picking
            ? hoverHex
              ? `Клікніть, щоб обрати ${hoverHex}`
              : "Наведіть на фото й клікніть по кольору тканини"
            : "Увімкніть піпетку й клікніть по фото, щоб обрати колір"}
        </p>
        <div className="relative">
          {src && (
            // eslint-disable-next-line @next/next/no-img-element -- need native img for canvas sampling
            <img
              src={src}
              alt="Вибір кольору з фото"
              className={`max-h-[360px] w-full object-contain ${picking ? "cursor-crosshair" : ""}`}
              {...(src.startsWith("http") ? { crossOrigin: "anonymous" as const } : {})}
              onMouseMove={async (e) => {
                if (!picking) return;
                const hex = await sampleAt(e.clientX, e.clientY, e.currentTarget);
                setHoverHex(hex);
              }}
              onMouseLeave={() => setHoverHex(null)}
              onClick={async (e) => {
                if (!picking) return;
                const hex = await sampleAt(e.clientX, e.clientY, e.currentTarget);
                if (hex) applyColor(hex);
              }}
            />
          )}
          {picking && hoverHex && (
            <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow">
              <span
                className="h-4 w-4 rounded-full border border-black/10"
                style={{ backgroundColor: hoverHex }}
              />
              {hoverHex}
            </span>
          )}
        </div>
      </div>

      {!single && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPicking((v) => !v)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              picking ? "bg-cobalt text-white" : "border border-[#E0E0E0] bg-white hover:border-obsidian"
            }`}
          >
            {picking ? "Піпетка увімкнена" : "Взяти колір з фото"}
          </button>
        </div>
      )}

      {colors.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {single && <span className="text-sm text-obsidian/60">Обраний колір:</span>}
          {colors.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => (single ? undefined : removeColor(hex))}
              title={single ? hex : `Прибрати ${hex}`}
              className={`relative h-9 w-9 rounded-full border border-black/10 ${
                single ? "ring-2 ring-cobalt ring-offset-2" : "group"
              }`}
              style={{ backgroundColor: hex }}
            >
              {!single && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-xs font-bold text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                  ×
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-obsidian/50">
          {single ? "Клікніть по тканині на фото, щоб обрати колір" : "Кольори ще не додані"}
        </p>
      )}
    </div>
  );
}
