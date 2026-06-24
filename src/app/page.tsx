export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import WatchCard from "@/components/WatchCard";
import LogoTransparent from "@/components/LogoTransparent";
import { ChevronRight, Shield, Truck, RotateCcw, Award } from "lucide-react";

export default async function HomePage() {
  // Only products that are still available (no end date, or end date in the future)
  const nowDate = new Date();
  const available = {
    archived: false,
    OR: [{ availableUntil: null }, { availableUntil: { gt: nowDate } }],
  };

  const featured = await prisma.product.findMany({
    where: { featured: true, ...available },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const newest = await prisma.product.findMany({
    where: available,
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  const perks = [
    { icon: Truck,     title: "Envío gratis",        desc: "En pedidos +€100" },
    { icon: Shield,    title: "Garantía 2 años",     desc: "En todos los relojes" },
    { icon: RotateCcw, title: "30 días devolución",  desc: "Sin preguntas" },
    { icon: Award,     title: "Calidad certificada", desc: "Movimientos suizos" },
  ];

  return (
    <div className="bg-white">

      {/* ── Hero ──────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d0d12 0%, #1a0a0b 45%, #0d0d12 100%)",
          minHeight: "88vh",
        }}
      >
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: "var(--brand)", filter: "blur(120px)" }}
          />
          <div
            className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-15"
            style={{ background: "var(--gold)", filter: "blur(140px)" }}
          />
        </div>

        {/* Thin decorative horizontal rule */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.4), transparent)" }} />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 flex items-center" style={{ minHeight: "88vh" }}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full py-24 lg:py-0">

            {/* Text */}
            <div>
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-8 fade-in">
                <span className="h-px w-8" style={{ background: "var(--gold)" }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.25em]"
                  style={{ color: "var(--gold)" }}
                >
                  Nueva Colección 2026
                </span>
              </div>

              {/* Headline */}
              <h1 className="fade-in-up font-display font-bold text-white leading-[1.05] mb-8" style={{ fontSize: "clamp(3.2rem, 7vw, 6rem)" }}>
                El tiempo<br />
                es <em className="not-italic" style={{ color: "var(--brand)" }}>tuyo.</em>
              </h1>

              {/* Body */}
              <p className="fade-in-up-2 text-gray-400 leading-relaxed mb-10 max-w-md" style={{ fontSize: "1.0625rem" }}>
                Relojes de precisión con diseño atemporal. Cada pieza es una declaración de quién eres.
              </p>

              {/* CTAs */}
              <div className="fade-in-up-3 flex flex-wrap gap-4">
                <Link href="/productos" className="btn-primary">
                  Ver colección <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/productos?orden=nuevo" className="btn-ghost">
                  Novedades
                </Link>
              </div>

              {/* Trust strip */}
              <div className="mt-12 fade-in-up-3 flex items-center gap-6 border-t pt-8" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                {["Envío a Europa", "Pago seguro", "Devolución 30 días"].map((t) => (
                  <span key={t} className="text-[11px] text-gray-500 uppercase tracking-widest">{t}</span>
                ))}
              </div>
            </div>

            {/* Logo orb */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative w-80 h-80">
                {/* Outer glow */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ boxShadow: "0 0 120px rgba(227,30,36,0.3), 0 0 60px rgba(201,169,110,0.15)" }}
                />
                {/* Rings */}
                <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(201,169,110,0.2)" }} />
                <div className="absolute inset-6 rounded-full" style={{ border: "1px solid rgba(227,30,36,0.15)" }} />
                <div className="absolute inset-14 rounded-full" style={{ border: "1px solid rgba(201,169,110,0.1)" }} />
                {/* Logo */}
                <div className="absolute inset-0 flex items-center justify-center p-12">
                  <LogoTransparent className="w-full h-auto drop-shadow-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.04))" }}
        />
      </section>

      {/* ── Perks strip ──────────────────────────── */}
      <section className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(227,30,36,0.07)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured products ─────────────────────── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="section-label">Selección</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-gray-900">
                Más destacados
              </h2>
            </div>
            <Link
              href="/productos"
              className="text-sm font-semibold flex items-center gap-1.5 hover:underline underline-offset-4"
              style={{ color: "var(--brand)" }}
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((product) => (
              <WatchCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Newest ───────────────────────────────── */}
      {newest.length > 0 && (
        <section className="py-20" style={{ background: "var(--surface)" }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="section-label">Recién llegados</span>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-gray-900">
                  Últimas incorporaciones
                </h2>
              </div>
              <Link
                href="/productos?orden=nuevo"
                className="text-sm font-semibold flex items-center gap-1.5 hover:underline underline-offset-4"
                style={{ color: "var(--brand)" }}
              >
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {newest.map((product) => (
                <WatchCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA banner ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div
          className="rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%)" }}
        >
          {/* Gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />

          <div className="px-10 lg:px-16 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative">
              <span className="section-label">Oferta especial</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-2">
                Envío gratis en toda Europa
              </h2>
              <p className="text-gray-400">En compras superiores a €100. Entrega en hasta 14 días hábiles.</p>
            </div>
            <Link
              href="/productos"
              className="flex-shrink-0 inline-flex items-center gap-2.5 px-8 py-3.5 rounded bg-white font-bold text-sm hover:opacity-90 transition-all hover:shadow-lg active:scale-95"
              style={{ color: "var(--brand)", letterSpacing: "0.05em" }}
            >
              Comprar ahora <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Bottom gold line */}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />
        </div>
      </section>

    </div>
  );
}
