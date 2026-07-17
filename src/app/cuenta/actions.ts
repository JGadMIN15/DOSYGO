"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { setCustomerSession, clearCustomerSession, getCurrentCustomer } from "@/lib/customer-auth";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { decideWelcomeSpin, decideLevelupSpin, type Prize } from "@/lib/roulette";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function registerCustomer(input: {
  username: string;
  email: string;
  name?: string;
  password: string;
}): Promise<AuthResult> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`register:${ip}`, 6, 15 * 60_000).allowed) {
    return { ok: false, error: "Demasiados intentos. Espera unos minutos." };
  }

  const username = String(input.username ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const name = String(input.name ?? "").trim().slice(0, 100) || null;
  const password = String(input.password ?? "");

  if (!USERNAME_RE.test(username)) {
    return { ok: false, error: "Usuario: 3–30 caracteres (letras, números o _)." };
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, error: "Introduce un email válido." };
  }
  if (password.length < 8 || password.length > 200) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  try {
    const customer = await prisma.customer.create({
      data: { username, email, name, passwordHash: hashPassword(password) },
      select: { id: true },
    });
    await setCustomerSession(customer.id);
    return { ok: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(",") ?? "";
      return {
        ok: false,
        error: target.includes("email")
          ? "Ese email ya tiene cuenta."
          : "Ese nombre de usuario ya está cogido.",
      };
    }
    console.error("registerCustomer failed:", err);
    return { ok: false, error: "No se pudo crear la cuenta. Inténtalo más tarde." };
  }
}

export async function loginCustomer(input: {
  username: string;
  password: string;
}): Promise<AuthResult> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`login-cust:${ip}`, 10, 15 * 60_000).allowed) {
    return { ok: false, error: "Demasiados intentos. Espera unos minutos." };
  }

  const username = String(input.username ?? "").trim();
  const password = String(input.password ?? "");
  if (!username || !password) {
    return { ok: false, error: "Usuario y contraseña son obligatorios." };
  }

  const customer = await prisma.customer.findUnique({
    where: { username },
    select: { id: true, passwordHash: true },
  });
  // Verify even when the user doesn't exist would need a dummy hash; a simple
  // generic message avoids leaking which usernames exist.
  if (!customer || !verifyPassword(password, customer.passwordHash)) {
    return { ok: false, error: "Usuario o contraseña incorrectos." };
  }

  await setCustomerSession(customer.id);
  return { ok: true };
}

export async function logoutCustomer(): Promise<void> {
  await clearCustomerSession();
  redirect("/");
}

export interface SpinResult {
  ok: boolean;
  error?: string;
  prize?: Prize; // 0 = nada
  source?: "welcome" | "levelup";
  remainingSpins?: number;
}

// Spin the roulette. The PRIZE IS DECIDED HERE (server) — the client only
// animates to the returned result. Consumes one spin atomically ($executeRaw:
// the Neon HTTP adapter rejects updateMany), then records the won discount.
export async function spinRoulette(): Promise<SpinResult> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`spin:${ip}`, 20, 60_000).allowed) {
    return { ok: false, error: "Vas muy rápido. Espera un momento." };
  }

  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, error: "Inicia sesión para girar." };

  let source: "welcome" | "levelup";
  let prize: Prize;

  if (!customer.welcomeSpun) {
    source = "welcome";
    prize = decideWelcomeSpin();
  } else if (customer.pendingSpins > 0) {
    source = "levelup";
    prize = decideLevelupSpin(customer.totalSpentCents);
  } else {
    return { ok: false, error: "No te quedan tiradas." };
  }

  // Consume the spin atomically (guards against a double-spend race).
  try {
    const consumed =
      source === "welcome"
        ? await prisma.$executeRaw`
            UPDATE "Customer" SET "welcomeSpun" = true, "updatedAt" = now()
            WHERE id = ${customer.id} AND "welcomeSpun" = false`
        : await prisma.$executeRaw`
            UPDATE "Customer" SET "pendingSpins" = "pendingSpins" - 1, "updatedAt" = now()
            WHERE id = ${customer.id} AND "pendingSpins" > 0`;
    if (consumed === 0) return { ok: false, error: "No te quedan tiradas." };
  } catch (err) {
    console.error("spinRoulette consume failed:", err);
    return { ok: false, error: "No se pudo girar. Inténtalo de nuevo." };
  }

  if (prize > 0) {
    try {
      await prisma.discountReward.create({
        data: { customerId: customer.id, percent: prize, source },
      });
    } catch (err) {
      console.error("spinRoulette reward create failed:", err);
    }
  }

  const welcomeLeft = source === "welcome" ? 0 : customer.welcomeSpun ? 0 : 1;
  const pendingLeft = source === "levelup" ? customer.pendingSpins - 1 : customer.pendingSpins;

  revalidatePath("/cuenta");
  return { ok: true, prize, source, remainingSpins: welcomeLeft + pendingLeft };
}
