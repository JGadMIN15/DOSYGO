import { NextRequest, NextResponse } from "next/server";
import { signValue, verifyValue, hashToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const OTP_COOKIE = "dosygo_email_otp";
const VERIFIED_COOKIE = "dosygo_email_verified";

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`otp-verify:${ip}`, 10, 10 * 60_000).allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }

  let email = "";
  let code = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
    code = String(body.code ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Petición no válida" }, { status: 400 });
  }

  const payload = verifyValue<{ email: string; codeHash: string; exp: number }>(
    req.cookies.get(OTP_COOKIE)?.value
  );
  if (!payload || payload.exp * 1000 < Date.now() || payload.email !== email) {
    return NextResponse.json({ error: "El código ha caducado. Pide uno nuevo." }, { status: 400 });
  }
  if (hashToken(code) !== payload.codeHash) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 400 });
  }

  const verified = signValue({
    email,
    exp: Math.floor(Date.now() / 1000) + 1800, // 30 min
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VERIFIED_COOKIE, verified, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 1800,
  });
  res.cookies.delete(OTP_COOKIE);
  return res;
}
