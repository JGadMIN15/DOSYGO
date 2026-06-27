// Real web search via Serper.dev (Google results). Free tier, NO credit card.
// Needs SERPER_API_KEY (from serper.dev). Returns [] when not configured or on
// any error, so callers can fall back gracefully.

export interface WebResult {
  title: string;
  snippet: string; // for shopping results this holds the price
  domain: string;
}

async function withTimeout(
  url: string,
  init: RequestInit,
  ms: number
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function domainOf(link: unknown): string {
  try {
    return new URL(String(link)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

interface SerperResponse {
  shopping?: { title?: unknown; price?: unknown; link?: unknown; source?: unknown }[];
  organic?: { title?: unknown; snippet?: unknown; link?: unknown }[];
}

export function isWebSearchConfigured(): boolean {
  return Boolean(process.env.SERPER_API_KEY);
}

export async function searchWeb(query: string, count = 8): Promise<WebResult[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];
  try {
    const res = await withTimeout(
      "https://google.serper.dev/search",
      {
        method: "POST",
        headers: { "X-API-KEY": key, "content-type": "application/json" },
        body: JSON.stringify({ q: query, gl: "es", hl: "es", num: 10 }),
      },
      10_000
    );
    if (!res.ok) return [];
    const data = (await res.json()) as SerperResponse;

    const out: WebResult[] = [];
    for (const s of data.shopping ?? []) {
      out.push({
        title: String(s.title ?? "").slice(0, 160),
        snippet: `${String(s.price ?? "")} (${String(s.source ?? "")})`.trim(),
        domain: domainOf(s.link ?? s.source),
      });
    }
    for (const o of data.organic ?? []) {
      out.push({
        title: String(o.title ?? "").slice(0, 160),
        snippet: String(o.snippet ?? "").slice(0, 220),
        domain: domainOf(o.link),
      });
    }
    return out.filter((r) => r.title || r.snippet).slice(0, count);
  } catch {
    return [];
  }
}
