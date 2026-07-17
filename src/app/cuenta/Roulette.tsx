"use client";

import { useState } from "react";
import { spinRoulette } from "./actions";
import { toast } from "@/lib/toast";
import Confetti from "@/components/Confetti";

// Visual wheel layout. Probabilities are decided server-side — this only needs
// a segment for every possible result so it can land on it.
const SEGMENTS: number[] = [5, 0, 15, 5, 20, 0, 50, 5]; // 0 = "Nada"
const N = SEGMENTS.length;
const SEG = 360 / N;

const COLOR: Record<number, string> = {
  0: "#26262d",
  5: "#c9a96e",
  15: "#e31e24",
  20: "#9e1b1f",
  50: "#f5c542",
};
const label = (v: number) => (v === 0 ? "Nada" : `${v}%`);

function slice(i: number, r = 96, cx = 100, cy = 100) {
  const a0 = (i * SEG * Math.PI) / 180;
  const a1 = ((i + 1) * SEG * Math.PI) / 180;
  const x0 = cx + r * Math.sin(a0);
  const y0 = cy - r * Math.cos(a0);
  const x1 = cx + r * Math.sin(a1);
  const y1 = cy - r * Math.cos(a1);
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}
function labelPos(i: number, r = 62, cx = 100, cy = 100) {
  const a = ((i + 0.5) * SEG * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

export default function Roulette({ initialSpins }: { initialSpins: number }) {
  const [spins, setSpins] = useState(initialSpins);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);

  async function spin() {
    if (spinning || spins <= 0) return;
    setSpinning(true);
    setWon(null);
    const res = await spinRoulette();
    if (!res.ok) {
      toast(res.error ?? "No se pudo girar.", "error");
      setSpinning(false);
      return;
    }
    const prize = res.prize ?? 0;
    const candidates = SEGMENTS.map((v, i) => (v === prize ? i : -1)).filter((i) => i >= 0);
    const idx = candidates[(Math.random() * candidates.length) | 0] ?? 0;
    const center = idx * SEG + SEG / 2;
    const jitter = (Math.random() - 0.5) * (SEG * 0.5);
    const targetMod = (((360 - center) % 360) + 360) % 360;
    setRotation((prev) => prev - (prev % 360) + 360 * 6 + targetMod + jitter);

    window.setTimeout(() => {
      setSpinning(false);
      setSpins(res.remainingSpins ?? Math.max(0, spins - 1));
      if (prize > 0) {
        setWon(prize);
        setBurst((b) => b + 1);
        toast(`¡Has ganado un ${prize}% de descuento! Se aplicará en tu próximo pedido.`, "success");
      } else {
        toast("Esta vez no ha tocado. ¡Suerte la próxima! 🍀", "info");
      }
    }, 4600);
  }

  return (
    <div className="flex flex-col items-center">
      {won !== null && <Confetti key={burst} />}

      <div className="relative w-56 h-56">
        {/* pointer */}
        <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-10" style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "16px solid var(--gold)" }} />
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl" style={{ transform: `rotate(${rotation}deg)`, transition: "transform 4.5s cubic-bezier(0.16,1,0.3,1)" }}>
          <circle cx="100" cy="100" r="99" fill="#0a0a0d" />
          {SEGMENTS.map((v, i) => (
            <path key={i} d={slice(i)} fill={COLOR[v]} stroke="#0a0a0d" strokeWidth="1.5" />
          ))}
          {SEGMENTS.map((v, i) => {
            const p = labelPos(i);
            return (
              <text
                key={`t${i}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={v === 50 ? 15 : 12}
                fontWeight="700"
                fill={v === 5 || v === 50 ? "#1a1a1a" : "#ffffff"}
              >
                {label(v)}
              </text>
            );
          })}
          <circle cx="100" cy="100" r="14" fill="#15151c" stroke="var(--gold)" strokeWidth="2" />
        </svg>
      </div>

      <button
        onClick={spin}
        disabled={spinning || spins <= 0}
        className="mt-5 rounded-xl px-7 py-3 text-white text-sm font-bold uppercase tracking-wide disabled:opacity-50 transition-transform active:scale-95"
        style={{ background: "linear-gradient(90deg, var(--brand), var(--brand-dark))" }}
      >
        {spinning ? "Girando…" : spins > 0 ? `Girar (${spins})` : "Sin tiradas"}
      </button>
    </div>
  );
}
