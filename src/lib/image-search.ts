// Google Programmable Search (Custom Search JSON API) image search + safe
// server-side download. Needs GOOGLE_CSE_KEY and GOOGLE_CSE_CX (a Programmable
// Search Engine id with "Image search" enabled).

import type { SupportedMediaType } from "@/lib/ai";

const ALLOWED: Record<string, { media: SupportedMediaType; ext: string }> = {
  "image/jpeg": { media: "image/jpeg", ext: "jpg" },
  "image/png": { media: "image/png", ext: "png" },
  "image/webp": { media: "image/webp", ext: "webp" },
  "image/gif": { media: "image/gif", ext: "gif" },
};

const MAX_BYTES = 8 * 1024 * 1024;
const MIN_BYTES = 1024;

export interface DownloadedImage {
  sourceUrl: string;
  mediaType: SupportedMediaType;
  ext: string;
  bytes: Buffer;
  data: string; // base64
}

async function withTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 DosygoBot" },
    });
  } finally {
    clearTimeout(t);
  }
}

/** Returns up to `count` candidate image URLs for the query. */
export async function searchImages(query: string, count = 6): Promise<string[]> {
  const key = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!key || !cx) {
    throw new Error(
      "Búsqueda de imágenes no configurada (faltan GOOGLE_CSE_KEY / GOOGLE_CSE_CX)."
    );
  }
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("imgType", "photo");
  url.searchParams.set("safe", "active");
  url.searchParams.set("num", String(Math.min(10, Math.max(1, count))));

  const res = await withTimeout(url.toString(), 10_000);
  if (!res.ok) {
    throw new Error(`Búsqueda de imágenes falló (HTTP ${res.status}).`);
  }
  const json = (await res.json()) as { items?: { link?: unknown }[] };
  const items = Array.isArray(json.items) ? json.items : [];
  return items
    .map((i) => (typeof i.link === "string" ? i.link : ""))
    .filter((l) => l.startsWith("https://"))
    .slice(0, count);
}

/**
 * Download an image URL into memory if it is a supported, reasonably-sized
 * raster image. Returns null on any problem (never throws). Only https URLs
 * are fetched; size and content-type are enforced.
 */
export async function downloadImage(
  sourceUrl: string
): Promise<DownloadedImage | null> {
  if (!sourceUrl.startsWith("https://")) return null;
  try {
    const res = await withTimeout(sourceUrl, 10_000);
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const allowed = ALLOWED[ct];
    if (!allowed) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_BYTES || bytes.length < MIN_BYTES) return null;
    return {
      sourceUrl,
      mediaType: allowed.media,
      ext: allowed.ext,
      bytes,
      data: bytes.toString("base64"),
    };
  } catch {
    return null;
  }
}
