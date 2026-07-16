"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import CatalogImage from "@/app/catalogo/CatalogImage";

export interface DailyWatch {
  brand: string;
  sku: string;
  url: string;
}

// Floating analog clock (bottom-right) with the live time, plus a small
// "watch of the day" popup above it. Hidden on the admin panel.
export default function ClockWidget({ daily }: { daily: DailyWatch | null }) {
  const [now, setNow] = useState<Date | null>(null);
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Initialise the clock on mount (time only exists client-side; setting it
    // here avoids a server/client hydration mismatch), then tick every second.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Render nothing on the server / before mount to avoid a hydration mismatch
  // (the time differs between server render and client).
  if (!now) return null;
  if (pathname && pathname.startsWith("/admin")) return null;

  const s = now.getSeconds();
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;
  const secAngle = s * 6;
  const minAngle = m * 6;
  const hourAngle = h * 30;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 print:hidden">
      {/* Watch of the day popup */}
      {open && daily && (
        <div
          className="w-64 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-[fadeInUp_0.4s_ease]"
          style={{ background: "linear-gradient(180deg,#15151c 0%,#0c0c11 100%)" }}
        >
          <div className="flex items-center justify-between px-3.5 pt-3">
            <span className="text-gold text-[10px] font-bold uppercase tracking-[0.22em]">Reloj del día</span>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Link href={`/catalogo/${encodeURIComponent(daily.sku)}`} className="flex items-center gap-3 px-3.5 py-3 group">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
              <CatalogImage src={daily.url} brand={daily.brand} sku={daily.sku} className="w-full h-full object-contain p-1 mix-blend-multiply" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>{daily.brand}</p>
              <p className="text-sm text-white leading-tight">Hoy destacamos este</p>
              <p className="text-[11px] text-gray-400 mt-0.5 group-hover:text-white transition-colors">Verlo y reservarlo →</p>
            </div>
          </Link>
        </div>
      )}

      {/* Analog clock — click toggles the popup */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Hora ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`}
        title="Reloj del día"
        className="relative w-16 h-16 rounded-full shadow-2xl transition-transform hover:scale-105"
        style={{ background: "radial-gradient(circle at 50% 35%, #1c1c24 0%, #0a0a0d 100%)", border: "1px solid rgba(201,169,110,0.45)" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {Array.from({ length: 12 }).map((_, k) => {
            const a = (k * 30 * Math.PI) / 180;
            const x1 = 50 + 40 * Math.sin(a);
            const y1 = 50 - 40 * Math.cos(a);
            const x2 = 50 + 46 * Math.sin(a);
            const y2 = 50 - 46 * Math.cos(a);
            const major = k % 3 === 0;
            return (
              <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={major ? "#c9a96e" : "rgba(255,255,255,0.35)"} strokeWidth={major ? 2.4 : 1.2} strokeLinecap="round" />
            );
          })}
          {/* hour */}
          <line x1="50" y1="50" x2="50" y2="29" stroke="#f2f2f2" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hourAngle} 50 50)`} />
          {/* minute */}
          <line x1="50" y1="50" x2="50" y2="19" stroke="#f2f2f2" strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${minAngle} 50 50)`} />
          {/* second */}
          <line x1="50" y1="57" x2="50" y2="15" stroke="#e31e24" strokeWidth="1.2" strokeLinecap="round" transform={`rotate(${secAngle} 50 50)`} />
          <circle cx="50" cy="50" r="2.8" fill="#c9a96e" />
        </svg>
      </button>
    </div>
  );
}
