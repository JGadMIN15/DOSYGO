"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import { getClientIp } from "@/lib/client-ip";
import { createProductRecord } from "@/lib/products";
import { findBySku, catalogImageUrl } from "@/lib/catalog";

const MAX = { name: 200, category: 100, description: 5000 } as const;

// Publish a catalogue model into the for-sale store as a Product. This is how
// the admin "pone a la venta" any catalogue item, whenever they want.
export async function publishCatalogItem(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const sku = String(formData.get("sku") ?? "").trim();
  const item = findBySku(sku);
  if (!item) redirect("/admin/catalogo");

  // Already for sale? Send the admin to its product page instead of duplicating.
  const existing = await prisma.product.findUnique({
    where: { catalogSku: item.sku },
    select: { id: true },
  });
  if (existing) redirect(`/admin/productos/${existing.id}`);

  const name = (String(formData.get("name") ?? "").trim() || `Reloj ${item.brand} ${item.sku}`).slice(0, MAX.name);
  const category = (String(formData.get("category") ?? "").trim() || item.brand).slice(0, MAX.category);
  const description = (
    String(formData.get("description") ?? "").trim() ||
    `Reloj ${item.brand}, referencia ${item.sku}. Pieza de nuestro catálogo, ahora disponible para compra.`
  ).slice(0, MAX.description);

  const priceEuros = Number(String(formData.get("priceEuros") ?? "").replace(",", "."));
  if (!Number.isFinite(priceEuros) || priceEuros <= 0 || priceEuros > 1_000_000) {
    redirect(`/admin/catalogo/${encodeURIComponent(item.sku)}?error=precio`);
  }
  const price = Math.round(priceEuros * 100);

  const stock = Number(formData.get("stock"));
  const safeStock = Number.isInteger(stock) && stock >= 0 && stock <= 1_000_000 ? stock : 1;

  const featured = formData.get("featured") === "on";

  let availableUntil: Date | null = null;
  const rawDate = String(formData.get("availableUntil") ?? "").trim();
  if (rawDate) {
    const parsed = new Date(`${rawDate}T23:59:59`);
    if (!Number.isNaN(parsed.getTime())) availableUntil = parsed;
  }

  const product = await createProductRecord({
    name,
    brand: item.brand,
    category,
    description,
    price,
    stock: safeStock,
    featured,
    images: JSON.stringify([catalogImageUrl(item.sku)]),
    availableUntil,
    catalogSku: item.sku,
  });

  try {
    await prisma.auditLog.create({
      data: {
        adminEmail: session.email,
        action: "catalog_publish",
        targetType: "product",
        targetId: product.id,
        detail: `${item.brand} ${item.sku}`,
        ip: getClientIp(await headers()),
      },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/productos");
  revalidatePath("/admin/productos");
  revalidatePath("/admin/catalogo");
  redirect(`/admin/productos/${product.id}`);
}
