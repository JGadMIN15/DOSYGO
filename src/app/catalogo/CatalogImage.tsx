"use client";
/* eslint-disable @next/next/no-img-element -- catalogue spans thousands of arbitrary hosts; plain <img> avoids per-host next/image config */

import { Watch } from "lucide-react";
import { useState } from "react";

// Plain <img> (not next/image) so the huge catalogue works with any image base
// without per-host next/image config. Falls back to a branded placeholder.
export default function CatalogImage({
  src,
  brand,
  sku,
  className,
}: {
  src: string;
  brand: string;
  sku: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 text-gray-400 ${className ?? ""}`}
        style={{ background: "linear-gradient(145deg, #f9f9f9 0%, #f0f0f0 100%)" }}
      >
        <Watch className="w-10 h-10" strokeWidth={1.3} />
        <span className="text-[10px] font-semibold uppercase tracking-widest">{brand}</span>
        <span className="text-[10px] font-mono">{sku}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${brand} ${sku}`}
      loading="lazy"
      onError={() => setError(true)}
      className={className}
    />
  );
}
