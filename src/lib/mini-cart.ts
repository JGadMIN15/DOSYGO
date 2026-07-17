import { create } from "zustand";

// Tiny UI store for the slide-out mini-cart (not persisted — it's ephemeral UI).
interface MiniCartUI {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export const useMiniCart = create<MiniCartUI>((set) => ({
  open: false,
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
}));
