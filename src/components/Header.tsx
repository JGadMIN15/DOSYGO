"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { ShoppingCart, Menu, X, Watch } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const count = useCartStore((s) => s.count());
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center">
              <span className="text-2xl font-black tracking-tight" style={{ color: "var(--brand)" }}>
                Dos
              </span>
              <span className="text-2xl font-black" style={{ color: "var(--brand)" }}>
                &amp;
              </span>
              <span className="text-2xl font-black tracking-tight" style={{ color: "var(--brand)" }}>
                Go
              </span>
              <Watch className="ml-2 w-5 h-5" style={{ color: "var(--brand)" }} />
            </div>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/productos" className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">
              Relojes
            </Link>
            <Link href="/productos?categoria=Cronógrafos" className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">
              Cronógrafos
            </Link>
            <Link href="/productos?categoria=Deportivos" className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">
              Deportivos
            </Link>
            <Link href="/productos?categoria=Clásicos" className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">
              Clásicos
            </Link>
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <Link
              href="/carrito"
              className="relative p-2 rounded-full hover:bg-red-50 transition-colors"
              aria-label="Carrito de compras"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {count > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
                  style={{ background: "var(--brand)" }}
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 flex flex-col gap-3">
            {["Relojes|/productos", "Cronógrafos|/productos?categoria=Cronógrafos", "Deportivos|/productos?categoria=Deportivos", "Clásicos|/productos?categoria=Clásicos"].map((item) => {
              const [label, href] = item.split("|");
              return (
                <Link
                  key={label}
                  href={href}
                  className="text-base font-medium text-gray-700 hover:text-red-600 transition-colors px-1"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
