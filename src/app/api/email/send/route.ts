import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { signValue, hashToken } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const OTP_COOKIE = "dosygo_email_otp";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`otp-send-ip:${ip}`, 5, 10 * 60_000).allowed) {
    return NextResponse.json({ error: "Demasiados envíos. Espera unos minutos." }, { status: 429 });
  }

  let email = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Petición no válida" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  }
  if (!rateLimit(`otp-send-email:${email}`, 5, 10 * 60_000).allowed) {
    return NextResponse.json(
      { error: "Demasiados envíos a este email. Espera unos minutos." },
      { status: 429 }
    );
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const token = signValue({
    email,
    codeHash: hashToken(code),
    exp: Math.floor(Date.now() / 1000) + 600, // 10 min
  });

  try {
    await sendOtpEmail(email, code);
  } catch (err) {
    console.error("OTP email send failed:", err);
    return NextResponse.json(
      { error: "No se pudo enviar el código. Inténtalo más tarde." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(OTP_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
