// Safely parse a Product.images JSON string into a URL array. Never throws,
// so a malformed row can't crash a render.
export function parseImages(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.map((v) => String(v)).filter(Boolean) : [];
  } catch {
    return [];
  }
}
