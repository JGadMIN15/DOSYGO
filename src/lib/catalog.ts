// The reservation catalogue: a large read-only list of watch models (brand +
// SKU) sourced from the supplier catalogues. It is NOT the for-sale store
// (those are Product rows with prices/stock). Kept as a bundled JSON file so it
// needs no DB seeding; only reservations are persisted.

import catalogData from "@/data/catalog.json";
import catalogImages from "@/data/catalog-images.json";

export interface CatalogItem {
  brand: string;
  sku: string;
}

const CATALOG = catalogData as CatalogItem[];
const BY_SKU = new Map(CATALOG.map((c) => [c.sku, c]));

export const CATALOG_SIZE = CATALOG.length;

export function findBySku(sku: string): CatalogItem | null {
  return BY_SKU.get(sku) ?? null;
}

export function allBrands(): { brand: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of CATALOG) counts.set(c.brand, (counts.get(c.brand) ?? 0) + 1);
  return [...counts.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => a.brand.localeCompare(b.brand));
}

export interface CatalogPage {
  items: CatalogItem[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
}

export function filterCatalog(opts: {
  brand?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): CatalogPage {
  const pageSize = opts.pageSize ?? 48;
  const q = (opts.q ?? "").trim().toLowerCase();
  const brand = (opts.brand ?? "").trim();

  let items = CATALOG;
  if (brand) items = items.filter((c) => c.brand === brand);
  if (q) {
    items = items.filter(
      (c) =>
        c.sku.toLowerCase().includes(q) || c.brand.toLowerCase().includes(q)
    );
  }

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, opts.page ?? 1), pages);
  const start = (page - 1) * pageSize;

  return { items: items.slice(start, start + pageSize), total, page, pages, pageSize };
}

const IMAGE_MAP = catalogImages as Record<string, string>;

// Resolve a catalogue photo URL for a SKU. Preferred source is the SKU→URL map
// in src/data/catalog-images.json, produced by scripts/upload-catalog-images.mjs
// after uploading the photos to Vercel Blob (keeps 400+ MB out of git and works
// with the existing Blob CSP/remotePatterns). Falls back to a local
// /catalogo-img/<SKU>.jpg path (or NEXT_PUBLIC_CATALOG_IMG_BASE) until uploaded;
// the UI shows a branded placeholder if the image 404s.
export function catalogImageUrl(sku: string): string {
  const mapped = IMAGE_MAP[sku];
  if (mapped) return mapped;
  const base = (process.env.NEXT_PUBLIC_CATALOG_IMG_BASE || "/catalogo-img").replace(/\/+$/, "");
  return `${base}/${encodeURIComponent(sku)}.jpg`;
}
