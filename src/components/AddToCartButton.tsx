"use client";

import { useCartStore } from "@/lib/store";
import { ShoppingCart, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/lib/toast";

interface Props {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
}

export default function AddToCartButton({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setAdded(true);
    toast(`${product.name} añadido al carrito`, "success");
    setTimeout(() => setAdded(false), 2000);
  };

  if (product.stock === 0) {
    return (
      <button disabled className="w-full py-4 rounded-2xl font-bold text-base bg-gray-100 text-gray-400 cursor-not-allowed">
        Producto agotado
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleAdd}
        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base text-white transition-all hover:scale-105 active:scale-95"
        style={{ background: added ? "#16a34a" : "var(--brand)" }}
      >
        {added ? (
          <>
            <Check className="w-5 h-5" />
            ¡Añadido al carrito!
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            Añadir al carrito
          </>
        )}
      </button>
      <Link
        href="/carrito"
        className="px-6 py-4 rounded-2xl font-bold text-base border-2 transition-all hover:bg-gray-50"
        style={{ borderColor: "var(--brand)", color: "var(--brand)" }}
      >
        Carrito
      </Link>
    </div>
  );
}
