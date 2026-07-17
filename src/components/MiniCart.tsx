"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { useMiniCart } from "@/lib/mini-cart";
import WatchImage from "./WatchImage";
import { formatPrice } from "@/lib/format";
import { X, ShoppingBag, Trash2, ChevronRight } from "lucide-react";

export default function MiniCart() {
  const open = useMiniCart((s) => s.open);
  const close = useMiniCart((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const total = useCartStore((s) => s.total);
  const count = useCartStore((s) => s.count);

  const subtotal = total();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden
        className={`fixed inset-0 z-[80] bg-black/50 transition-opacity duration-300 print:hidden ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Carrito"
        className={`fixed top-0 right-0 h-full w-[88%] max-w-sm z-[85] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out print:hidden ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: "var(--brand)" }} />
            Tu carrito <span className="text-gray-400 font-normal">({count()})</span>
          </h2>
          <button onClick={close} aria-label="Cerrar" className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(227,30,36,0.08)" }}>
              <ShoppingBag className="w-8 h-8" style={{ color: "var(--brand)" }} />
            </div>
            <p className="text-gray-900 font-semibold mb-1">Tu carrito está vacío</p>
            <p className="text-sm text-gray-500 mb-5">Descubre relojes que te encantarán.</p>
            <Link href="/productos" onClick={close} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "var(--brand)" }}>
              Ver relojes <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <WatchImage src={item.image} name={item.name} category="Relojes" className="w-full h-full scale-90" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                    <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} aria-label="Quitar" className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 px-5 py-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="font-black text-lg text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex gap-2">
                <Link href="/carrito" onClick={close} className="flex-1 text-center py-3 rounded-xl border-2 text-sm font-bold text-gray-700 hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                  Ver carrito
                </Link>
                <Link href="/carrito" onClick={close} className="flex-1 text-center py-3 rounded-xl text-white text-sm font-bold" style={{ background: "var(--brand)" }}>
                  Pagar
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
