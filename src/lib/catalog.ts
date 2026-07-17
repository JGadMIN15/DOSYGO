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

// A few catalogue models that are guaranteed to have a real photo (used for the
// homepage showcase). Optionally restrict to a brand; falls back to any brand.
export function catalogItemsWithImages(n: number, brand?: string): CatalogItem[] {
  const out: CatalogItem[] = [];
  for (const c of CATALOG) {
    if (brand && c.brand !== brand) continue;
    if (IMAGE_MAP[c.sku]) {
      out.push(c);
      if (out.length >= n) break;
    }
  }
  return out;
}

// Random showcase models with a real photo, spread across DIFFERENT brands so
// the hero never repeats the same watch. Picks one random model per brand, then
// shuffles brands and takes `n`. Random each request (home is force-dynamic).
export function randomCatalogItemsWithImages(n: number): CatalogItem[] {
  const byBrand = new Map<string, CatalogItem[]>();
  for (const c of CATALOG) {
    if (!IMAGE_MAP[c.sku]) continue;
    const arr = byBrand.get(c.brand);
    if (arr) arr.push(c);
    else byBrand.set(c.brand, [c]);
  }

  const picks: CatalogItem[] = [];
  for (const arr of byBrand.values()) {
    picks.push(arr[Math.floor(Math.random() * arr.length)]);
  }
  // Fisher–Yates shuffle so the brands appear in a random order too.
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return picks.slice(0, n);
}

// Search the catalogue for the chatbot: match a brand mentioned in the query,
// else keyword-match on brand/sku. Prefers models that have a photo. Falls back
// to a small sample so the assistant always has something to suggest.
export function searchCatalog(query: string, limit = 8): CatalogItem[] {
  const q = (query ?? "").toLowerCase();
  const withImg = CATALOG.filter((c) => IMAGE_MAP[c.sku]);

  // 1) explicit brand mention
  const brands = [...new Set(CATALOG.map((c) => c.brand))];
  const brand = brands.find((b) => b.length >= 3 && q.includes(b.toLowerCase()));
  if (brand) return withImg.filter((c) => c.brand === brand).slice(0, limit);

  // 2) keyword match on brand/sku
  const words = q.split(/[^a-z0-9]+/i).filter((w) => w.length >= 3);
  if (words.length) {
    const hits = withImg.filter((c) =>
      words.some((w) => c.brand.toLowerCase().includes(w) || c.sku.toLowerCase().includes(w))
    );
    if (hits.length) return hits.slice(0, limit);
  }

  // 3) fallback: a small varied sample
  return randomCatalogSampleWithImages(limit);
}

// Deterministic "watch of the day": same model all day, changes each day.
// Uses the current date as a stable index into the models that have a photo.
export function dailyCatalogItemWithImages(): CatalogItem | null {
  const withImg: CatalogItem[] = [];
  for (const c of CATALOG) if (IMAGE_MAP[c.sku]) withImg.push(c);
  if (withImg.length === 0) return null;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return withImg[dayIndex % withImg.length];
}

// Random sample of `n` distinct models that have a photo (may repeat brands) —
// used to fill a grid on the homepage. Random each request.
export function randomCatalogSampleWithImages(n: number): CatalogItem[] {
  const withImg: CatalogItem[] = [];
  for (const c of CATALOG) if (IMAGE_MAP[c.sku]) withImg.push(c);

  const res: CatalogItem[] = [];
  const used = new Set<number>();
  const max = withImg.length;
  while (res.length < n && res.length < max) {
    const idx = Math.floor(Math.random() * max);
    if (used.has(idx)) continue;
    used.add(idx);
    res.push(withImg[idx]);
  }
  return res;
}

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
