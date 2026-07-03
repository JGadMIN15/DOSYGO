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
    <header className="sticky top-0 z-50 bg-white" style={{ borderBottom: "1px solid var(--border)" }}>

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
            <span className="font-display text-2xl font-bold tracking-tight" style={{ color: "var(--brand)" }}>
              Dos
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-gray-900">&amp;</span>
            <span className="font-display text-2xl font-bold tracking-tight" style={{ color: "var(--brand)" }}>
              Go
            </span>
          </Link>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar relojes, marcas..."
                className="w-full pl-4 pr-11 py-2.5 text-sm rounded-full bg-gray-50 border focus:outline-none focus:bg-white transition-all"
                style={{ borderColor: "var(--border)" }}
              />
              <button
                type="submit"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Relojes link — desktop */}
            <Link
              href="/productos"
              className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-50"
            >
              Relojes
            </Link>

            {/* Catálogo (reserva) — desktop */}
            <Link
              href="/catalogo"
              className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-50"
            >
              Catálogo
            </Link>

            {/* Cart */}
            <Link
              href="/carrito"
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {count > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-[17px] h-[17px] flex items-center justify-center rounded-full text-white text-[9px] font-bold"
                    style={{ background: "var(--brand)" }}
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">Carrito</span>
            </Link>

            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white shadow-lg" style={{ borderColor: "var(--border)" }}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar relojes, marcas..."
                className="w-full pl-4 pr-11 py-2.5 text-sm rounded-full bg-gray-50 border focus:outline-none"
                style={{ borderColor: "var(--border)" }}
              />
              <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </button>
            </form>

            <Link
              href="/productos"
              className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Todos los relojes
            </Link>

            <Link
              href="/catalogo"
              className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
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
