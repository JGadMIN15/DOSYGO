// Best-effort in-memory fixed-window rate limiter.
//
// IMPORTANT (production): state lives in this process's memory, so in a
// multi-instance / serverless deployment each instance keeps its own counters
// and limits are only enforced per-instance. This still blunts naive floods,
// but for cluster-wide guarantees back it with a shared store such as
// @upstash/ratelimit (Redis). The `rateLimit` signature below is intentionally
// simple so it can be swapped for a distributed implementation without touching
// callers.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Allow up to `limit` requests per `windowMs` for a given `key` (e.g. an IP).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Bound memory: drop expired buckets if the map grows too large.
  if (buckets.size > MAX_TRACKED_KEYS) prune(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    retryAfterSeconds: 0,
  };
}
