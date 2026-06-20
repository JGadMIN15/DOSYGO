export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import WatchCard from "@/components/WatchCard";
import LogoTransparent from "@/components/LogoTransparent";
import { ChevronRight, Shield, Truck, RotateCcw, Award } from "lucide-react";

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { featured: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const newest = await prisma.product.findMany({
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  const categories = [
    { name: "Cronógrafos",  img: "⏱️", href: "/productos?categoria=Cron%C3%B3grafos", desc: "Precisión al segundo" },
    { name: "Deportivos",   img: "🏃", href: "/productos?categoria=Deportivos",        desc: "Resistentes y funcionales" },
    { name: "Clásicos",     img: "🎩", href: "/productos?categoria=Cl%C3%A1sicos",     desc: "Elegancia atemporal" },
    { name: "Para Ella",    img: "💐", href: "/productos?categoria=Para+Ella",          desc: "Diseños femeninos" },
    { name: "Minimalistas", img: "✦",  href: "/productos?categoria=Minimalistas",      desc: "Diseño puro" },
    { name: "Smart",        img: "📱", href: "/productos?categoria=Smart",             desc: "Tecnología al pulso" },
  ];

  const perks = [
    { icon: Truck,     title: "Envío gratis",        desc: "En pedidos +€100" },
    { icon: Shield,    title: "Garantía 2 años",     desc: "En todos los relojes" },
    { icon: RotateCcw, title: "30 días devolución",  desc: "Sin preguntas" },
    { icon: Award,     title: "Calidad certificada", desc: "Movimientos suizos" },
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #111 0%, #2a1010 50%, #111 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full" style={{ background: "var(--brand)", filter: "blur(100px)" }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full" style={{ background: "var(--brand)", filter: "blur(120px)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 items-center gap-12">
          {/* Text */}
          <div className="fade-in-up">
            <span
              className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full mb-5 text-white"
              style={{ background: "rgba(227,30,36,0.3)", border: "1px solid rgba(227,30,36,0.5)" }}
            >
              Nueva Colección 2026
            </span>
            <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
              El tiempo es<br />
              <span style={{ color: "var(--brand)" }}>tuyo.</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-md leading-relaxed">
              Relojes de precisión suiza con diseño español. Cada pieza cuenta una historia.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: "var(--brand)" }}
              >
                Ver colección <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/productos?orden=nuevo"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-bold text-sm border border-white/20 text-white hover:bg-white/10 transition-all"
              >
                Novedades
              </Link>
            </div>
          </div>

          {/* Logo */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 100px rgba(227,30,36,0.35)" }} />
              <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(227,30,36,0.2)" }} />
              <div className="absolute inset-8 rounded-full" style={{ border: "1px solid rgba(227,30,36,0.12)" }} />
              <div className="absolute inset-0 flex items-center justify-center p-10">
                <LogoTransparent className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perks strip */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(227,30,36,0.08)" }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: "var(--brand)" }} />
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

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--brand)" }}>Colecciones</p>
            <h2 className="text-2xl font-black text-gray-900">Explora por categoría</h2>
          </div>
          <Link href="/productos" className="text-sm font-semibold flex items-center gap-1 hover:underline" style={{ color: "var(--brand)" }}>
            Ver todo <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2.5 hover:border-red-300 hover:shadow-md transition-all text-center"
            >
              <span className="text-3xl">{cat.img}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-red-600 transition-colors">{cat.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--brand)" }}>Selección</p>
              <h2 className="text-2xl font-black text-gray-900">Más destacados</h2>
            </div>
            <Link href="/productos" className="text-sm font-semibold flex items-center gap-1 hover:underline" style={{ color: "var(--brand)" }}>
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((product) => (
              <WatchCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Promo banners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Banner 1 */}
          <Link href="/productos?categoria=Cronógrafos" className="group relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 100%)", minHeight: 200 }}>
            <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity" style={{ background: "var(--brand)", filter: "blur(60px)" }} />
            <div className="relative p-8 h-full flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Colección especial</p>
                <h3 className="text-2xl font-black text-white mb-2">Cronógrafos</h3>
                <p className="text-gray-400 text-sm">Precisión al milisegundo</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-red-400 group-hover:gap-2 transition-all">
                Descubrir <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Banner 2 */}
          <Link href="/productos?categoria=Para+Ella" className="group relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a2d 0%, #1a1a1a 100%)", minHeight: 200 }}>
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: "#4a4ae3", filter: "blur(60px)" }} />
            <div className="relative p-8 h-full flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Para ella</p>
                <h3 className="text-2xl font-black text-white mb-2">Elegancia femenina</h3>
                <p className="text-gray-400 text-sm">Diseños exclusivos para mujer</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-400 group-hover:gap-2 transition-all">
                Descubrir <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Newest */}
      {newest.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--brand)" }}>Recién llegados</p>
              <h2 className="text-2xl font-black text-gray-900">Últimas incorporaciones</h2>
            </div>
            <Link href="/productos?orden=nuevo" className="text-sm font-semibold flex items-center gap-1 hover:underline" style={{ color: "var(--brand)" }}>
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {newest.map((product) => (
              <WatchCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div
          className="rounded-2xl p-10 lg:p-14 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
          style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <div className="absolute right-0 top-0 w-72 h-72 rounded-full bg-white" style={{ filter: "blur(60px)" }} />
          </div>
          <div className="relative text-white">
            <h2 className="text-3xl lg:text-4xl font-black mb-2">Envío gratis en toda España</h2>
            <p className="text-white/80">En compras superiores a €100. Entrega garantizada en 24-48h.</p>
          </div>
          <Link
            href="/productos"
            className="relative flex-shrink-0 inline-flex items-center gap-2 px-8 py-3.5 bg-white rounded-lg font-bold text-sm hover:opacity-90 transition-all"
            style={{ color: "var(--brand)" }}
          >
            Comprar ahora <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
