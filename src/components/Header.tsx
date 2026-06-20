"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { ShoppingCart, Search, Menu, X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const NAV = [
  { label: "Todos los relojes", href: "/productos" },
  { label: "Cronógrafos", href: "/productos?categoria=Cronógrafos" },
  { label: "Deportivos", href: "/productos?categoria=Deportivos" },
  { label: "Clásicos", href: "/productos?categoria=Clásicos" },
  { label: "Para Ella", href: "/productos?categoria=Para+Ella" },
  { label: "Minimalistas", href: "/productos?categoria=Minimalistas" },
  { label: "Smart", href: "/productos?categoria=Smart" },
];

export default function Header() {
  const count = useCartStore((s) => s.count());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/productos?buscar=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top bar */}
      <div className="text-white text-xs py-2 text-center font-medium" style={{ background: "var(--brand)" }}>
        Envío gratis en pedidos superiores a 100€ · Entrega en 24-48h
      </div>

      {/* Main header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-black tracking-tight" style={{ color: "var(--brand)" }}>
                Dos<span style={{ color: "#1a1a1a" }}>&amp;</span>Go
              </span>
            </Link>

            {/* Search bar — desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar relojes, marcas..."
                  className="w-full pl-4 pr-12 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-red-400 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search mobile */}
              <button
                className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>

              {/* Cart */}
              <Link
                href="/carrito"
                className="relative flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {count > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-white text-xs font-bold w-4.5 h-4.5 w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px]"
                    style={{ background: "var(--brand)" }}
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                )}
                <span className="hidden sm:block text-sm font-medium text-gray-700">Carrito</span>
              </Link>

              {/* Mobile menu */}
              <button
                className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          {searchOpen && (
            <div className="md:hidden pb-3">
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar relojes, marcas..."
                  className="w-full pl-4 pr-12 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-red-400"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Category nav — desktop */}
      <div className="hidden md:block border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex-shrink-0 px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-600 transition-all whitespace-nowrap border-b-2 border-transparent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
