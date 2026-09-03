"use client";

import { useEffect, useState } from "react";
import { MediaImage } from "@/components/MediaImage";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-card bg-white text-sm text-obsidian/50 md:h-[540px]">
        Немає фото
      </div>
    );
  }

  const safeActive = Math.min(active, images.length - 1);

  return (
    <div>
      <div className="relative h-[420px] overflow-hidden rounded-card bg-white md:h-[540px]">
        {images[safeActive] && (
          <MediaImage
            src={images[safeActive]}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-4">
          {images.slice(0, 4).map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-20 overflow-hidden rounded-xl transition md:h-24 ${
                i === safeActive ? "ring-2 ring-cobalt ring-offset-2" : "opacity-80 hover:opacity-100"
              }`}
              aria-label={`Фото ${i + 1}`}
            >
              <MediaImage src={src} alt={`${alt} — фото ${i + 1}`} fill sizes="25vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
