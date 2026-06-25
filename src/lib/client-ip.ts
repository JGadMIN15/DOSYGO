// Resolve the client IP for rate-limiting keys. On Vercel, `x-real-ip` is set
// by the platform to the true client IP and cannot be overridden by the client,
// so prefer it over the left-most x-forwarded-for entry (which a client can spoof
// on setups without a sanitizing proxy).
export function getClientIp(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real && real.trim()) return real.trim();
  const fwd = headers.get("x-forwarded-for");
  if (fwd && fwd.trim()) return fwd.split(",")[0].trim();
  return "unknown";
}
