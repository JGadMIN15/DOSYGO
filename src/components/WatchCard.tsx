"use client";

import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { useCartStore } from "@/lib/store";
import WatchImage from "./WatchImage";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { parseImages } from "@/lib/images";

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
  const [wishlisted, setWishlisted] = useState(false);
  const images = parseImages(product.images);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: product.id, name: product.name, price: product.price, image: images[0] ?? "" });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((w) => !w);
  };

  const priceFormatted = formatPrice(product.price);

  return (
    <Link href={`/productos/${product.id}`} className="group block">
      <article className="bg-white rounded-xl overflow-hidden watch-card border border-gray-100">

        {/* Image */}
        <div
          className="relative overflow-hidden aspect-square"
          style={{ background: "linear-gradient(145deg, #f9f9f9 0%, #f0f0f0 100%)" }}
        >
          <WatchImage
            src={images[0]}
            name={product.name}
            category={product.category}
            className="w-full h-full object-contain p-5 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.featured && (
              <span
                className="px-2.5 py-0.5 text-white text-[9px] font-bold uppercase tracking-[0.1em] rounded-sm"
                style={{ background: "var(--brand)" }}
              >
                Destacado
              </span>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-[0.1em] rounded-sm">
                Últimas
              </span>
            )}
            {product.stock === 0 && (
              <span className="px-2.5 py-0.5 bg-gray-400 text-white text-[9px] font-bold uppercase tracking-[0.1em] rounded-sm">
                Agotado
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? "Quitar de favoritos" : "Añadir a favoritos"}
            className="absolute top-3 right-3 w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
          >
            <Heart
              className="w-4 h-4 transition-colors"
              fill={wishlisted ? "var(--brand)" : "none"}
              stroke={wishlisted ? "var(--brand)" : "#9ca3af"}
            />
          </button>

          {/* Add to cart — slide up */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="w-full py-3.5 text-white text-[11px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{
                background: added
                  ? "#16a34a"
                  : "linear-gradient(90deg, var(--brand) 0%, var(--brand-dark) 100%)",
              }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {added ? "Añadido ✓" : product.stock === 0 ? "Sin stock" : "Añadir al carrito"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p
            className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2"
            style={{ color: "var(--gold)" }}
          >
            {product.brand}
          </p>
          <h3 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 group-hover:text-red-700 transition-colors duration-200 min-h-[2.5rem] mb-4">
            {product.name}
          </h3>
          <p className="text-xl font-bold text-gray-900 tracking-tight font-sans">
            {priceFormatted}
          </p>
        </div>
      </article>
    </Link>
  );
}
