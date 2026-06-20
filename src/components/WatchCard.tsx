"use client";

import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
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
}

export default function WatchCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const images: string[] = JSON.parse(product.images);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0] ?? "",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link href={`/productos/${product.id}`} className="block group">
      <div className="watch-card bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg">
        {/* Imagen */}
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-square overflow-hidden">
          <WatchImage
            src={images[0]}
            name={product.name}
            category={product.category}
            className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
          />
          <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-600 border border-gray-200">
            {product.category}
          </span>
          {product.stock <= 5 && product.stock > 0 && (
            <span className="absolute top-3 right-3 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              ¡Últimas {product.stock}!
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{product.brand}</p>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-xs text-gray-400 ml-1">(24)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              {product.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
            </span>
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: added ? "#16a34a" : "var(--brand)" }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {added ? "¡Añadido!" : product.stock === 0 ? "Agotado" : "Añadir"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
