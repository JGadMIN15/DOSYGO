import Link from "next/link";
import { prisma } from "@/lib/prisma";
import WatchCard from "@/components/WatchCard";
import LogoTransparent from "@/components/LogoTransparent";
import { ChevronRight, Shield, Truck, RotateCcw, Award, Watch } from "lucide-react";

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { featured: true },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  const categories = [
    { name: "Cronógrafos",  emoji: "⏱️", href: "/productos?categoria=Cron%C3%B3grafos" },
    { name: "Deportivos",   emoji: "🏃", href: "/productos?categoria=Deportivos" },
    { name: "Clásicos",     emoji: "🎩", href: "/productos?categoria=Cl%C3%A1sicos" },
    { name: "Para Ella",    emoji: "💐", href: "/productos?categoria=Para+Ella" },
    { name: "Minimalistas", emoji: "✦",  href: "/productos?categoria=Minimalistas" },
    { name: "Smart",        emoji: "📱", href: "/productos?categoria=Smart" },
  ];

  const perks = [
    { icon: Truck,      title: "Envío gratis",       desc: "En pedidos +€100" },
    { icon: Shield,     title: "Garantía 2 años",    desc: "En todos los relojes" },
    { icon: RotateCcw,  title: "30 días devolución", desc: "Sin preguntas" },
    { icon: Award,      title: "Calidad certificada",desc: "Movimientos suizos" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 50%, #1a1a1a 100%)" }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full" style={{ background: "var(--brand)", filter: "blur(80px)" }} />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full" style={{ background: "var(--brand)", filter: "blur(120px)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-2xl fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 text-white" style={{ background: "rgba(227,30,36,0.25)", border: "1px solid rgba(227,30,36,0.4)" }}>
              <Watch className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
              Nueva colección 2026
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
              El tiempo es
              <span className="block" style={{ color: "var(--brand)" }}>tuyo.</span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-lg">
              Relojes de precisión suiza con diseño español. Cada pieza cuenta una historia. ¿Cuál será la tuya?
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/productos"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base transition-all hover:scale-105 active:scale-95"
                style={{ background: "var(--brand)" }}
              >
                Ver colección
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/productos"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border border-white/20 text-white hover:bg-white/10 transition-all"
              >
                Más vendidos
              </Link>
            </div>
          </div>
        </div>

        {/* Logo hero */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center pointer-events-none">
          <div className="relative w-80 h-80">
            {/* Glow rings */}
            <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 80px rgba(227,30,36,0.4)" }} />
            <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(227,30,36,0.25)" }} />
            <div className="absolute inset-6 rounded-full" style={{ border: "1px solid rgba(227,30,36,0.15)" }} />
            {/* Logo sin fondo */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <LogoTransparent className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(227,30,36,0.08)" }}>
                  <Icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--brand)" }}>Colecciones</p>
          <h2 className="text-3xl font-black text-gray-900">Explora por categoría</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-all hover:-translate-y-1"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors text-center leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Relojes destacados */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--brand)" }}>Selección</p>
            <h2 className="text-3xl font-black text-gray-900">Más destacados</h2>
          </div>
          <Link
            href="/productos"
            className="hidden sm:flex items-center gap-1 text-sm font-semibold hover:underline"
            style={{ color: "var(--brand)" }}
          >
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((product) => (
            <WatchCard key={product.id} product={product} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold transition-all hover:scale-105"
            style={{ background: "var(--brand)" }}
          >
            Ver toda la colección <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Banner promo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="rounded-3xl p-10 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)" }}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white" style={{ filter: "blur(60px)" }} />
          </div>
          <div className="relative text-white">
            <h2 className="text-3xl lg:text-4xl font-black mb-3">Envío gratis en toda España</h2>
            <p className="text-white/80 text-lg">En compras superiores a €100. Entrega en 24-48h.</p>
          </div>
          <Link
            href="/productos"
            className="relative inline-flex items-center gap-2 px-8 py-4 bg-white rounded-2xl font-bold text-base transition-all hover:scale-105 flex-shrink-0"
            style={{ color: "var(--brand)" }}
          >
            Comprar ahora <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
