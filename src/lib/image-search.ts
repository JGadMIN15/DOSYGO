// Safe server-side image download. Used to fetch admin-provided image URLs
// (pasted or uploaded) so they can be verified with vision and re-hosted to
// Vercel Blob. https only; content-type and size are enforced.

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

export function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
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
