"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CatalogImage from "@/app/catalogo/CatalogImage";

export interface HeroModel {
  brand: string;
  sku: string;
  url: string;
}

// Rotating watch spotlight. All models are stacked and cross-faded via opacity
// transitions (a clean dissolve, no hard cut). White disc + mix-blend-multiply
// melts each photo's white background so only the watch shows.
export default function HeroCarousel({ models }: { models: HeroModel[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (models.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % models.length), 7000);
    return () => clearInterval(t);
  }, [models.length]);

  if (models.length === 0) return null;
  const active = models[i] ?? models[0];

  return (
    <div className="flex justify-center items-center">
      <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] fade-in">
        {/* ambient halo */}
        <div
          className="absolute -inset-8 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(158,27,31,0.22) 0%, rgba(201,169,110,0.10) 42%, transparent 68%)", filter: "blur(22px)" }}
        />
        {/* gold ring */}
        <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(201,169,110,0.35)" }} />
        {/* white spotlight disc with cross-fading watches — clicking goes to
            the model currently shown */}
        <Link
          href={`/catalogo?marca=${encodeURIComponent(active.brand)}`}
          aria-label={`Ver relojes ${active.brand}`}
          className="absolute inset-4 rounded-full overflow-hidden block transition-transform duration-300 ease-out hover:scale-[1.03]"
          style={{ background: "#ffffff", boxShadow: "inset 0 1px 30px rgba(0,0,0,0.08), 0 44px 96px rgba(0,0,0,0.55)" }}
        >
          {models.map((m, k) => (
            <div
              key={m.sku}
              aria-hidden={k !== i}
              className="absolute inset-0 flex items-center justify-center will-change-[opacity]"
              style={{
                opacity: k === i ? 1 : 0,
                transition: "opacity 1600ms ease-in-out",
              }}
            >
              <CatalogImage
                src={m.url}
                brand={m.brand}
                sku={m.sku}
                className="w-[82%] h-[82%] object-contain mix-blend-multiply"
              />
            </div>
          ))}
        </Link>

        {/* brand chip (cross-fades) */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-7 w-40 pointer-events-none">
          {models.map((m, k) => (
            <span
              key={m.sku}
              aria-hidden={k !== i}
              className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-lg"
              style={{ background: "var(--brand)", opacity: k === i ? 1 : 0, transition: "opacity 1200ms ease-in-out" }}
            >
              {m.brand}
            </span>
          ))}
        </div>

        {/* dots */}
        {models.length > 1 && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {models.map((m, k) => (
              <button
                key={m.sku}
                type="button"
                onClick={() => setI(k)}
                aria-label={`Ver ${m.brand}`}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: k === i ? 20 : 6,
                  background: k === i ? "var(--brand)" : "rgba(255,255,255,0.28)",
                }}
              />
            ))}
          </div>
        )}

        {/* accessible current label */}
        <span className="sr-only">{active.brand}</span>
      </div>
    </div>
  );
}
