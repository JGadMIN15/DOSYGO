import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

// Next.js 16: "middleware" is deprecated and renamed to "proxy". Runs on the
// nodejs runtime (edge is not supported here).

const ALLOWED_ORIGINS = new Set([
  "https://dosygo.es",
  "https://www.dosygo.es",
]);

const MAX_BODY_BYTES = 10_000;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Demasiadas peticiones" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  // --- Admin area: require a valid signed session cookie. This is a
  //     defense-in-depth gate; every admin Server Action and route handler
  //     also re-verifies auth on its own. ---
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!verifySession(req.cookies.get(SESSION_COOKIE)?.value)) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  if (pathname.startsWith("/api/admin")) {
    if (!verifySession(req.cookies.get(SESSION_COOKIE)?.value)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const ip = clientIp(req);

  // --- /api/checkout: state-changing and creates (billable) Stripe sessions ---
  if (pathname === "/api/checkout" && req.method === "POST") {
    const limit = rateLimit(`checkout:${ip}`, 10, 60_000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const origin = req.headers.get("origin");

    // In production, block cross-origin POSTs (CSRF). Allow the site's own
    // origin (whatever domain it is served from) plus any explicitly
    // allow-listed origins.
    if (
      process.env.NODE_ENV === "production" &&
      origin &&
      origin !== req.nextUrl.origin &&
      !ALLOWED_ORIGINS.has(origin)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Reject oversized payloads
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // Require JSON content type
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
  }

  // --- /api/tracking/[code]: throttle to deter tracking-code enumeration ---
  if (pathname.startsWith("/api/tracking/") && req.method === "GET") {
    const limit = rateLimit(`tracking:${ip}`, 30, 60_000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/checkout",
    "/api/tracking/:path*",
  ],
};
