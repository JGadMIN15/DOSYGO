"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store";

export default function ClearCartOnLoad() {
  const clearCart = useCartStore((s) => s.clearCart);
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}
