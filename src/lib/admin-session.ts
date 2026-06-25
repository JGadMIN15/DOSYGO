// Cookie-backed admin session helpers for Server Components and Server Actions.
// Kept separate from src/lib/auth.ts because it imports next/headers.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
  type SessionPayload,
} from "@/lib/auth";

export async function getAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function setAdminSession(user: {
  id: string;
  email: string;
  role: string;
}): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    exp,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Use at the top of every protected Server Component / Server Action.
 * Redirects to the login page when there is no valid session.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  // Re-validate against the DB so that deleting an account or changing its role
  // takes effect immediately, instead of trusting the (up to 8h) cookie role.
  const user = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, role: true },
  });
  if (!user) redirect("/admin/login");
  return { sub: user.id, email: user.email, role: user.role, exp: session.exp };
}

/** Require a specific role (e.g. "admin"). Sends others back to the dashboard. */
export async function requireRole(role: string): Promise<SessionPayload> {
  const session = await requireAdmin();
  if (session.role !== role) redirect("/admin");
  return session;
}
