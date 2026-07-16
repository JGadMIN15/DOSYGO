import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Customer (loyalty) sessions. Separate cookie + HMAC domain ("cust:") from the
// admin session and OTP tokens, so tokens can never be cross-used. Signed with
// ADMIN_SESSION_SECRET (the app's single session secret).
export const CUSTOMER_COOKIE = "dosygo_customer";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const DOMAIN = "cust:";

interface CustSession {
  sub: string; // Customer id
  exp: number; // epoch seconds
}

function secretOrNull(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

function sign(payload: CustSession): string {
  const s = secretOrNull();
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set (>= 32 chars)");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", s).update(DOMAIN).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token: string | undefined | null): CustSession | null {
  if (!token) return null;
  const s = secretOrNull();
  if (!s) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", s).update(DOMAIN).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as CustSession;
    if (typeof p.sub !== "string" || typeof p.exp !== "number" || p.exp * 1000 < Date.now()) {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export async function setCustomerSession(customerId: string): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const token = sign({ sub: customerId, exp });
  (await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function clearCustomerSession(): Promise<void> {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

// Returns the logged-in Customer (fresh from the DB) or null.
export async function getCurrentCustomer() {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  const session = verify(token);
  if (!session) return null;
  return prisma.customer.findUnique({ where: { id: session.sub } });
}
