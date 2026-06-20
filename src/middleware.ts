import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set([
  "https://dosygo.es",
  "https://www.dosygo.es",
]);

const MAX_BODY_BYTES = 10_000;

export function middleware(req: NextRequest) {
  const { pathname, origin: reqOrigin } = req.nextUrl;

  if (pathname === "/api/checkout" && req.method === "POST") {
    const origin = req.headers.get("origin");

    // In production enforce same-origin
    if (
      process.env.NODE_ENV === "production" &&
      origin &&
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/checkout"],
};
