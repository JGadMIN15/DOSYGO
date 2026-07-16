"use client";

import { useEffect, useRef } from "react";

// Self-contained confetti burst (no external deps — CSP-safe). Fires once on
// mount and cleans itself up. Used on confirmation screens for a little joy.
export default function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const colors = ["#e31e24", "#c9a96e", "#ffffff", "#ff6b6f", "#e6cfa0"];
    const W = window.innerWidth;
    const N = Math.min(160, Math.round(W / 8));
    type P = { x: number; y: number; vx: number; vy: number; s: number; rot: number; vr: number; color: string; life: number };
    const parts: P[] = Array.from({ length: N }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.5,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 6,
      vy: 2 + Math.random() * 4,
      s: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[(Math.random() * colors.length) | 0],
      life: 1,
    }));

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of parts) {
        p.vy += 0.12; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (elapsed > 2200) p.life -= 0.02; // fade out near the end
        if (p.life > 0 && p.y < window.innerHeight + 40) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
          ctx.restore();
        }
      }
      if (alive && elapsed < 3500) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[90] print:hidden" aria-hidden />;
}
