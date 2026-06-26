// Shared product-persistence logic used by both the manual admin form
// (src/app/admin/actions.ts) and the AI assistant. Kept here (not in a
// "use server" file) so it can be imported freely without exposing internal
// helpers as Server Actions.

import { prisma } from "@/lib/prisma";
import { syncProductToStripe } from "@/lib/stripe-sync";

export interface ProductData {
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number; // céntimos
  stock: number;
  featured: boolean;
  images: string; // JSON array of URLs
  availableUntil: Date | null;
}

// Mirror a product to Stripe and persist the returned ids. Non-fatal: a Stripe
// outage or misconfigured key must never block managing the catalog.
export async function syncProductRecord(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
}): Promise<void> {
  try {
    const ids = await syncProductToStripe(product);
    await prisma.product.update({ where: { id: product.id }, data: ids });
  } catch (err) {
    console.error("Stripe product sync failed (product saved in DB):", err);
  }
}

export async function createProductRecord(data: ProductData) {
  const product = await prisma.product.create({ data });
  await syncProductRecord(product);
  return product;
}
