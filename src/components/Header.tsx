"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const count = useCartStore((s) => s.count());
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/productos?buscar=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50" style={{ background: "#0b0b0f" }}>

      {/* Promotional bar */}
      <div
        className="text-white text-[11px] py-2 text-center font-medium tracking-wide"
        style={{ background: "var(--brand)" }}
      >
        Envío gratis en pedidos superiores a 100€ · Entrega en hasta 14 días hábiles
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-baseline gap-0.5">
            <span className="font-display text-2xl font-bold tracking-tight" style={{ color: "var(--brand)" }}>Dos</span>
            <span className="font-display text-2xl font-bold tracking-tight text-white">&amp;</span>
            <span className="font-display text-2xl font-bold tracking-tight" style={{ color: "var(--brand)" }}>Go</span>
          </Link>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar relojes, marcas..."
                className="w-full pl-4 pr-11 py-2.5 text-sm rounded-full bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link
              href="/productos"
              className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Relojes
            </Link>

            <Link
              href="/catalogo"
              className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Catálogo
            </Link>

            {/* Cart */}
            <Link
              href="/carrito"
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-gray-200" />
                {count > 0 && (
                  <span
                    key={count}
                    className="badge-pop absolute -top-1.5 -right-1.5 w-[17px] h-[17px] flex items-center justify-center rounded-full text-white text-[9px] font-bold"
                    style={{ background: "var(--brand)" }}
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-200">Carrito</span>
            </Link>

            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-200 hover:bg-white/5 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Gold hairline */}
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.45), transparent)" }} />

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t shadow-lg" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#0b0b0f" }}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar relojes, marcas..."
                className="w-full pl-4 pr-11 py-2.5 text-sm rounded-full bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
              />
              <button type="submit" aria-label="Buscar" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <Search className="w-4 h-4" />
              </button>
            </form>

            <Link
              href="/productos"
              className="px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Todos los relojes
            </Link>

            <Link
              href="/catalogo"
              className="px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Catálogo · Reservar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
