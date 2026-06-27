// Dependency-free admin auth primitives (Node crypto only).
//
// - Passwords: scrypt with a per-password random salt; constant-time verify.
// - Sessions: a compact "<payload>.<hmac>" token signed with HMAC-SHA256 using
//   ADMIN_SESSION_SECRET. Stateless and tamper-evident; store it in an httpOnly
//   cookie (see src/lib/admin-session.ts).
//
// This module must stay free of next/headers so it can also be imported by
// proxy.ts (which runs on the Node.js runtime in Next 16).

import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
  createHash,
} from "node:crypto";

const SCRYPT_KEYLEN = 64;

export const SESSION_COOKIE = "dosygo_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export interface SessionPayload {
  sub: string; // AdminUser id
  email: string;
  role: string;
  exp: number; // expiry, epoch seconds
}

// --- Password hashing -------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

// --- One-time activation tokens --------------------------------------------
// The raw token travels in the activation link; only its hash is stored, so a
// database leak does not expose usable tokens.

export function generateSetupToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Generic HMAC-signed value for short-lived stateless tokens (e.g. email OTP).
// A domain-separation label ("otp:") is mixed into the MAC so a value signed
// here can never validate as an admin session token (signSession), and vice
// versa, even if the payload shapes ever overlapped.
const VALUE_DOMAIN = "otp:";

export function signValue(value: unknown): string {
  const body = Buffer.from(JSON.stringify(value)).toString("base64url");
  const sig = createHmac("sha256", getSecret())
    .update(VALUE_DOMAIN)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyValue<T>(token: string | undefined | null): T | null {
  if (!token) return null;
  const secret = getSecretOrNull();
  if (!secret) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret)
    .update(VALUE_DOMAIN)
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (expected.length === 0) return false;

  const derived = scryptSync(password, salt, expected.length);
  // timingSafeEqual throws on length mismatch, so guard first.
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

// --- Session tokens ---------------------------------------------------------

function getSecretOrNull(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

function getSecret(): string {
  const secret = getSecretOrNull();
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set (must be at least 32 characters)"
    );
  }
  return secret;
}

export function signSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(
  token: string | undefined | null
): SessionPayload | null {
  if (!token) return null;

  const secret = getSecretOrNull();
  if (!secret) return null; // fail closed if misconfigured

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(body).digest("base64url");

  const given = Buffer.from(sig);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as SessionPayload;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp * 1000 < Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
