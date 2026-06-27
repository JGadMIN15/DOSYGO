// Safe server-side image download. Used to fetch admin-provided image URLs
// (pasted or uploaded) so they can be verified with vision and re-hosted to
// Vercel Blob. Hardened against SSRF: https only, port 443 only, private/
// loopback/link-local/cloud-metadata IPs blocked (incl. after each redirect),
// and the body is read with a hard streaming size cap.

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { SupportedMediaType } from "@/lib/ai";

const ALLOWED: Record<string, { media: SupportedMediaType; ext: string }> = {
  "image/jpeg": { media: "image/jpeg", ext: "jpg" },
  "image/png": { media: "image/png", ext: "png" },
  "image/webp": { media: "image/webp", ext: "webp" },
  "image/gif": { media: "image/gif", ext: "gif" },
};

const MAX_BYTES = 8 * 1024 * 1024;
const MIN_BYTES = 1024;
const MAX_REDIRECTS = 3;

export interface DownloadedImage {
  sourceUrl: string;
  mediaType: SupportedMediaType;
  ext: string;
  bytes: Buffer;
  data: string; // base64
}

export function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

// Reject any address that is not a public, internet-routable unicast IP.
function isBlockedIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const p = ip.split(".").map(Number);
    if (p[0] === 0 || p[0] === 10 || p[0] === 127) return true;
    if (p[0] === 169 && p[1] === 254) return true; // link-local + cloud metadata
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 192 && p[1] === 168) return true;
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // CGNAT
    if (p[0] >= 224) return true; // multicast / reserved
    return false;
  }
  if (v === 6) {
    const lo = ip.toLowerCase();
    if (lo === "::1" || lo === "::") return true;
    if (lo.startsWith("fe80") || lo.startsWith("fc") || lo.startsWith("fd")) return true;
    if (lo.startsWith("::ffff:")) {
      const tail = lo.split(":").pop() ?? "";
      if (isIP(tail) === 4) return isBlockedIp(tail);
    }
    return false;
  }
  return true; // not a valid IP → block
}

// Validate scheme/port/host and ensure every resolved address is public.
async function assertSafeUrl(raw: string): Promise<void> {
  const u = new URL(raw);
  if (u.protocol !== "https:") throw new Error("scheme");
  if (u.port && u.port !== "443") throw new Error("port");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isBlockedIp(host)) throw new Error("private-ip");
    return;
  }
  const addrs = await lookup(host, { all: true });
  if (addrs.length === 0) throw new Error("dns");
  for (const a of addrs) {
    if (isBlockedIp(a.address)) throw new Error("private-ip");
  }
}

async function readCapped(res: Response, max: number): Promise<Buffer | null> {
  const len = Number(res.headers.get("content-length") ?? "");
  if (Number.isFinite(len) && len > max) return null;
  const reader = res.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.length;
      if (total > max) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks);
}

/**
 * Download an image URL into memory if it is a supported, reasonably-sized
 * raster image hosted on a public address. Returns null on any problem (never
 * throws). Redirects are followed manually and each hop is re-validated.
 */
export async function downloadImage(
  sourceUrl: string
): Promise<DownloadedImage | null> {
  try {
    let url = sourceUrl;
    let res: Response | null = null;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertSafeUrl(url); // throws → caught below

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10_000);
      let r: Response;
      try {
        r = await fetch(url, {
          signal: ctrl.signal,
          redirect: "manual",
          headers: { "user-agent": "Mozilla/5.0 DosygoBot" },
        });
      } finally {
        clearTimeout(t);
      }

      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get("location");
        if (!loc) return null;
        url = new URL(loc, url).toString(); // re-validated at next loop iteration
        continue;
      }
      res = r;
      break;
    }

    if (!res || !res.ok) return null;

    const ct = (res.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const allowed = ALLOWED[ct];
    if (!allowed) return null;

    const bytes = await readCapped(res, MAX_BYTES);
    if (!bytes || bytes.length < MIN_BYTES) return null;

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
