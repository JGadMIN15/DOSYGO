"use client";

import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { useCartStore } from "@/lib/store";
import WatchImage from "./WatchImage";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string;
  category: string;
  brand: string;
  stock: number;
  featured?: boolean;
}

export default function WatchCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const images: string[] = JSON.parse(product.images);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: product.id, name: product.name, price: product.price, image: images[0] ?? "" });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const priceFormatted = product.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  return (
    <Link href={`/productos/${product.id}`} className="group block">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Image */}
        <div className="relative bg-gray-50 aspect-square overflow-hidden">
          <WatchImage
            src={images[0]}
            name={product.name}
            category={product.category}
            className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.featured && (
              <span className="px-2 py-0.5 text-white text-[10px] font-bold uppercase tracking-wide rounded" style={{ background: "var(--brand)" }}>
                Destacado
              </span>
            )}
            {product.stock <= 5 && product.stock > 0 && (
              <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wide rounded">
                Últimas unidades
              </span>
            )}
            {product.stock === 0 && (
              <span className="px-2 py-0.5 bg-gray-500 text-white text-[10px] font-bold uppercase tracking-wide rounded">
                Agotado
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => e.preventDefault()}
            className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-sm hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Heart className="w-4 h-4 text-gray-400" />
          </button>

          {/* Add to cart overlay */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="w-full py-2.5 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400 transition-colors"
              style={{ background: added ? "#16a34a" : "var(--brand)" }}
            >
              <ShoppingCart className="w-4 h-4" />
              {added ? "¡Añadido!" : product.stock === 0 ? "Agotado" : "Añadir al carrito"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{product.brand}</p>
          <h3 className="text-sm font-medium text-gray-800 leading-snug mb-3 line-clamp-2 group-hover:text-red-600 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-900">{priceFormatted}</span>
            <span className="text-xs text-gray-400">{product.category}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
