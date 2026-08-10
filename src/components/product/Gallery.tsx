"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative h-[420px] overflow-hidden rounded-card bg-white md:h-[540px]">
        {images[active] && (
          <Image
            src={images[active]}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-4">
        {images.slice(0, 4).map((src, i) => (
          <button
            key={src + i}
            onClick={() => setActive(i)}
            className={`relative h-20 overflow-hidden rounded-xl transition md:h-24 ${
              i === active ? "ring-2 ring-cobalt ring-offset-2" : "opacity-80 hover:opacity-100"
            }`}
            aria-label={`Фото ${i + 1}`}
          >
            <Image src={src} alt={`${alt} — фото ${i + 1}`} fill sizes="25vw" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
