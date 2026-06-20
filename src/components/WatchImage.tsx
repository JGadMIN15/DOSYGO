"use client";

import Image from "next/image";
import { Watch } from "lucide-react";
import { useState } from "react";

const categoryColors: Record<string, { bg: string; accent: string }> = {
  "Cronógrafos":   { bg: "#1e293b", accent: "#e31e24" },
  "Deportivos":    { bg: "#0f172a", accent: "#3b82f6" },
  "Clásicos":      { bg: "#292524", accent: "#d4a847" },
  "Minimalistas":  { bg: "#f8fafc", accent: "#64748b" },
  "Para Ella":     { bg: "#fdf2f8", accent: "#ec4899" },
  "Smart":         { bg: "#0f172a", accent: "#22c55e" },
};

interface WatchImageProps {
  src: string;
  name: string;
  category: string;
  className?: string;
}

function Placeholder({ name, category, className }: Omit<WatchImageProps, "src">) {
  const colors = categoryColors[category] ?? { bg: "#1e293b", accent: "#e31e24" };
  return (
    <div className={`flex items-center justify-center relative ${className ?? ""}`}>
      <div
        className="w-40 h-40 rounded-full shadow-2xl flex items-center justify-center relative"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${colors.accent}22, ${colors.bg})`,
          border: `4px solid ${colors.accent}44`,
          boxShadow: `0 0 40px ${colors.accent}33, inset 0 0 20px ${colors.bg}88`,
        }}
      >
        <div className="absolute inset-2 rounded-full" style={{ border: `1px solid ${colors.accent}33` }} />
        <div className="relative flex flex-col items-center justify-center gap-1">
          <Watch className="w-12 h-12" style={{ color: colors.accent }} strokeWidth={1.5} />
          <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: colors.accent }}>
            Dos&amp;Go
          </span>
        </div>
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <div
            key={deg}
            className="absolute rounded-full"
            style={{
              background: deg % 90 === 0 ? colors.accent : `${colors.accent}66`,
              transform: `rotate(${deg}deg) translateY(-74px)`,
              transformOrigin: "center 74px",
              height: deg % 90 === 0 ? "12px" : "6px",
              width: deg % 90 === 0 ? "3px" : "2px",
            }}
          />
        ))}
      </div>
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-[10px] font-medium text-gray-500 truncate px-2 block">
          {name}
        </span>
      </div>
    </div>
  );
}

export default function WatchImage({ src, name, category, className }: WatchImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <Placeholder name={name} category={category} className={className} />;
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <Image
        src={src}
        alt={name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
}
