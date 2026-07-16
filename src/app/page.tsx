export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import WatchCard from "@/components/WatchCard";
import LogoTransparent from "@/components/LogoTransparent";
import HeroCarousel from "@/components/HeroCarousel";
import CatalogCard from "@/app/catalogo/CatalogCard";
import { randomCatalogItemsWithImages, randomCatalogSampleWithImages, catalogImageUrl, CATALOG_SIZE } from "@/lib/catalog";
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

  // Real watch photos from the reservation catalogue power the showcase — random
  // models across different brands so the hero never repeats the same watch.
  const heroModels = randomCatalogItemsWithImages(6).map((c) => ({ brand: c.brand, sku: c.sku, url: catalogImageUrl(c.sku) }));
  // Grid of real catalogue watches shown as you scroll the homepage.
  const gridItems = randomCatalogSampleWithImages(8);

  const perks = [
    { icon: Truck,     title: "Envío gratis",        desc: "En pedidos +€100" },
    { icon: Shield,    title: "Garantía 2 años",     desc: "En todos los relojes" },
    { icon: RotateCcw, title: "30 días devolución",  desc: "Sin preguntas" },
    { icon: Award,     title: "Calidad certificada", desc: "Selección premium" },
  ];

  return (
    <div className="bg-white">

      {/* ── Hero ──────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: "90vh",
          background:
            "radial-gradient(120% 90% at 78% 26%, rgba(158,27,31,0.16) 0%, transparent 44%), radial-gradient(90% 80% at 10% 92%, rgba(201,169,110,0.06) 0%, transparent 46%), linear-gradient(180deg, #0d0d12 0%, #08080b 100%)",
        }}
      >
        {/* Subtle organic shape behind the watch */}
        <div
          className="hidden lg:block absolute -right-52 top-1/2 -translate-y-1/2 w-[760px] h-[760px] pointer-events-none opacity-70"
          style={{ background: "radial-gradient(circle at 42% 42%, #16161d 0%, transparent 68%)", borderRadius: "44% 56% 62% 38% / 46% 44% 56% 54%" }}
        />

        {/* Top gold hairline */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.5), transparent)" }} />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 flex items-center" style={{ minHeight: "90vh" }}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full py-24 lg:py-0">

            {/* Text */}
            <div>
              <div className="flex items-center gap-3 mb-7 fade-in">
                <span className="h-px w-9" style={{ background: "linear-gradient(90deg, transparent, var(--gold))" }} />
                <span className="text-gold text-[10px] font-bold uppercase tracking-[0.28em]">
                  Relojería · Dos&amp;Go
                </span>
              </div>

              <h1 className="fade-in-up font-display font-bold text-white leading-[1.02] mb-7" style={{ fontSize: "clamp(3rem, 6.6vw, 5.6rem)" }}>
                El tiempo<br />
                es <span style={{ color: "var(--brand)" }}>tuyo.</span>
              </h1>

              <p className="fade-in-up-2 text-gray-400 leading-relaxed mb-9 max-w-md" style={{ fontSize: "1.0625rem" }}>
                Relojes de precisión y diseño atemporal. Explora nuestro catálogo de más de{" "}
                <span className="text-gray-200 font-semibold">{CATALOG_SIZE.toLocaleString("es-ES")}</span> modelos y resérvalo antes de que salga.
              </p>

              <div className="fade-in-up-3 flex flex-wrap gap-4">
                <Link href="/catalogo" className="btn-primary">
                  Explorar catálogo <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/productos" className="btn-ghost">
                  Ver tienda
                </Link>
              </div>

              <div className="mt-11 fade-in-up-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-7" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                {["Envío a Europa", "Pago seguro", "Devolución 30 días"].map((t) => (
                  <span key={t} className="text-[11px] text-gray-500 uppercase tracking-widest">{t}</span>
                ))}
              </div>
            </div>

            {/* Watch spotlight (rotates through models) */}
            {heroModels.length > 0 ? (
              <HeroCarousel models={heroModels} />
            ) : (
              <div className="flex justify-center items-center">
                <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] fade-in">
                  <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(201,169,110,0.35)" }} />
                  <div className="absolute inset-4 rounded-full flex items-center justify-center" style={{ background: "#0f0f14" }}>
                    <LogoTransparent className="w-3/4 h-auto" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </section>

      {/* ── Perks strip (dark, continues the hero) ── */}
      <section style={{ background: "#0a0a0d" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(227,30,36,0.14)" }}>
                  <Icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smooth transition from the dark hero/perks into the light content */}
      <div className="h-20" style={{ background: "linear-gradient(to bottom, #0a0a0d 0%, var(--surface) 100%)" }} />

      {/* ── Relojes del catálogo (grid) ───────────── */}
      {gridItems.length > 0 && (
        <section className="py-16 lg:py-20" style={{ background: "var(--surface)" }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="section-label">Catálogo</span>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-gray-900">Relojes para reservar</h2>
              </div>
              <Link href="/catalogo" className="text-sm font-semibold flex items-center gap-1.5 hover:underline underline-offset-4" style={{ color: "var(--brand)" }}>
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {gridItems.map((item) => (
                <CatalogCard key={item.sku} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured products (si hay tienda) ─────── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="section-label">Selección</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-gray-900">Más destacados</h2>
            </div>
            <Link href="/productos" className="text-sm font-semibold flex items-center gap-1.5 hover:underline underline-offset-4" style={{ color: "var(--brand)" }}>
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

      {/* ── Newest (si hay tienda) ────────────────── */}
      {newest.length > 0 && (
        <section className="py-20" style={{ background: "var(--surface)" }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="section-label">Recién llegados</span>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-gray-900">Últimas incorporaciones</h2>
              </div>
              <Link href="/productos?orden=nuevo" className="text-sm font-semibold flex items-center gap-1.5 hover:underline underline-offset-4" style={{ color: "var(--brand)" }}>
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
        <div className="rounded-2xl relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%)" }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />
          <div className="px-10 lg:px-16 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative">
              <span className="section-label">Reserva sin riesgo</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-2">
                Señal reembolsable a 14 días
              </h2>
              <p className="text-gray-400 max-w-lg">Resérvalo hoy con una señal. Si no conseguimos tu reloj en 14 días, te la devolvemos íntegra.</p>
            </div>
            <Link href="/catalogo" className="flex-shrink-0 inline-flex items-center gap-2.5 px-8 py-3.5 rounded bg-white font-bold text-sm hover:opacity-90 transition-all hover:shadow-lg active:scale-95" style={{ color: "var(--brand)", letterSpacing: "0.05em" }}>
              Reservar ahora <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />
        </div>
      </section>

    </div>
  );
}
