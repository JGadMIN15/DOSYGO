"use client";

import { useState, useEffect } from "react";
import CatalogImage from "@/app/catalogo/CatalogImage";

export interface HeroModel {
  brand: string;
  sku: string;
  url: string;
}

// Rotating watch spotlight for the hero: cycles through catalogue models on a
// white disc, with mix-blend-multiply so each photo's white background melts in.
export default function HeroCarousel({ models }: { models: HeroModel[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (models.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % models.length), 4000);
    return () => clearInterval(t);
  }, [models.length]);

  const m = models[i] ?? models[0];
  if (!m) return null;

  return (
    <div className="flex justify-center items-center">
      <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] fade-in">
        {/* ambient halo */}
        <div
          className="absolute -inset-6 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(227,30,36,0.20) 0%, rgba(201,169,110,0.10) 40%, transparent 66%)", filter: "blur(18px)" }}
        />
        {/* gold ring */}
        <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(201,169,110,0.35)" }} />
        {/* white spotlight disc + watch */}
        <div
          className="absolute inset-4 rounded-full overflow-hidden flex items-center justify-center"
          style={{ background: "#ffffff", boxShadow: "inset 0 1px 26px rgba(0,0,0,0.07), 0 40px 90px rgba(0,0,0,0.55)" }}
        >
          <CatalogImage
            key={m.sku}
            src={m.url}
            brand={m.brand}
            sku={m.sku}
            className="w-[82%] h-[82%] object-contain mix-blend-multiply hero-swap"
          />
        </div>
        {/* brand chip */}
        <div
          key={`chip-${m.sku}`}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-white whitespace-nowrap shadow-lg hero-swap"
          style={{ background: "var(--brand)" }}
        >
          {m.brand}
        </div>
        {/* dots */}
        {models.length > 1 && (
          <div className="absolute -bottom-11 left-1/2 -translate-x-1/2 flex gap-2">
            {models.map((mm, k) => (
              <button
                key={mm.sku}
                type="button"
                onClick={() => setI(k)}
                aria-label={`Ver modelo ${k + 1}`}
                className="w-2 h-2 rounded-full transition-all"
                style={{ background: k === i ? "var(--brand)" : "rgba(255,255,255,0.28)", transform: k === i ? "scale(1.3)" : "scale(1)" }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
