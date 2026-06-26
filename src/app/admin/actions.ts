"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  hashPassword,
  hashToken,
  generateSetupToken,
} from "@/lib/auth";
import {
  setAdminSession,
  clearAdminSession,
  requireAdmin,
  requireRole,
} from "@/lib/admin-session";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { archiveStripeProduct } from "@/lib/stripe-sync";
import {
  createProductRecord,
  syncProductRecord,
  type ProductData,
} from "@/lib/products";

export interface ActionState {
  error?: string;
  success?: string;
}

async function clientIp(): Promise<string> {
  return getClientIp(await headers());
}

// Audit trail. Best-effort: a logging failure must never block the action.
async function logAudit(entry: {
  adminEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
  ip?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

// --- Authentication ---------------------------------------------------------

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const MIN_PASSWORD_LENGTH = 8;

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Throttle login attempts to deter brute force / credential stuffing.
  const ip = await clientIp();
  const limit = rateLimit(`admin-login:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return {
      error: `Demasiados intentos. Espera ${limit.retryAfterSeconds}s e inténtalo de nuevo.`,
    };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Introduce email y contraseña." };
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });

  // Account lockout: block while the cooldown is active.
  if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await logAudit({ adminEmail: email, action: "login_failed", detail: "locked", ip });
    return {
      error: "Cuenta bloqueada temporalmente por seguridad. Inténtalo más tarde.",
    };
  }

  // Account created but not activated yet (no password set).
  if (user && !user.passwordHash) {
    return {
      error:
        "Tu cuenta aún no está activada. Abre el enlace de activación que te enviaron para crear tu contraseña.",
    };
  }

  // Run a verify even when the user is missing to flatten timing differences
  // and avoid leaking which emails exist.
  const ok =
    user && user.passwordHash
      ? verifyPassword(password, user.passwordHash)
      : verifyPassword(password, "scrypt$00$00");

  if (!user || !ok) {
    if (user) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_FAILED_LOGINS;
      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          // Keep the counter growing (don't reset on lock) so that once the
          // lock expires, any further failure re-locks immediately instead of
          // granting a fresh batch of attempts. Reset only on successful login.
          failedLoginAttempts: attempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCK_MINUTES * 60_000)
            : null,
        },
      });
    }
    await logAudit({ adminEmail: email, action: "login_failed", ip });
    return { error: "Credenciales incorrectas." };
  }

  // Success: clear any failure counters.
  if (user.failedLoginAttempts !== 0 || user.lockedUntil) {
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  await logAudit({ adminEmail: user.email, action: "login_success", ip });
  await setAdminSession({ id: user.id, email: user.email, role: user.role });
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}

// First-login activation: set the password using a one-time token.
export async function activateAccount(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await clientIp();
  const limit = rateLimit(`admin-activate:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return { error: "Demasiados intentos. Espera un momento e inténtalo de nuevo." };
  }

  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return { error: "Enlace de activación no válido." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const user = await prisma.adminUser.findFirst({
    where: { setupToken: hashToken(token), setupTokenExpires: { gt: new Date() } },
  });
  if (!user) {
    return { error: "El enlace de activación no es válido o ha caducado." };
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(password),
      setupToken: null,
      setupTokenExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  await logAudit({ adminEmail: user.email, action: "account_activated", ip });
  await setAdminSession({ id: user.id, email: user.email, role: user.role });
  redirect("/admin");
}

// --- Product CRUD -----------------------------------------------------------

const MAX = { name: 200, brand: 100, category: 100, description: 5000 } as const;
const CUID_RE = /^c[a-z0-9]{24,}$/i;

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function parseProductForm(
  formData: FormData
): { data: ProductData } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").replace(",", ".").trim();
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const featured =
    formData.get("featured") === "on" || formData.get("featured") === "true";
  const imagesRaw = String(formData.get("images") ?? "[]");
  const availableUntilRaw = String(formData.get("availableUntil") ?? "").trim();

  if (!name || name.length > MAX.name)
    return { error: "El nombre es obligatorio (máx. 200 caracteres)." };
  if (!brand || brand.length > MAX.brand)
    return { error: "La marca es obligatoria (máx. 100 caracteres)." };
  if (!category || category.length > MAX.category)
    return { error: "La categoría es obligatoria (máx. 100 caracteres)." };
  if (!description || description.length > MAX.description)
    return { error: "La descripción es obligatoria (máx. 5000 caracteres)." };

  const priceEuros = Number(priceRaw);
  if (!Number.isFinite(priceEuros) || priceEuros < 0 || priceEuros > 1_000_000)
    return { error: "El precio no es válido." };
  const price = Math.round(priceEuros * 100); // céntimos

  const stock = Number(stockRaw);
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000)
    return { error: "El stock no es válido (número entero)." };

  let images: unknown;
  try {
    images = JSON.parse(imagesRaw);
  } catch {
    return { error: "Las imágenes no son válidas." };
  }
  if (!Array.isArray(images) || images.length === 0)
    return { error: "Añade al menos una imagen." };
  if (images.length > 10) return { error: "Máximo 10 imágenes por producto." };

  const urls = images.map((value) => String(value));
  for (const url of urls) {
    // Accept https URLs (e.g. Vercel Blob) and existing local /productos paths.
    if (!(isHttpsUrl(url) || url.startsWith("/productos/"))) {
      return { error: "Hay una URL de imagen no válida." };
    }
  }

  // Optional "available until": a date input (YYYY-MM-DD) means available
  // through the end of that day. Empty = always available.
  let availableUntil: Date | null = null;
  if (availableUntilRaw) {
    const parsed = new Date(`${availableUntilRaw}T23:59:59`);
    if (Number.isNaN(parsed.getTime())) {
      return { error: "La fecha de disponibilidad no es válida." };
    }
    availableUntil = parsed;
  }

  return {
    data: {
      name,
      brand,
      category,
      description,
      price,
      stock,
      featured,
      images: JSON.stringify(urls),
      availableUntil,
    },
  };
}

export async function createProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();

  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const product = await createProductRecord(parsed.data);
  await logAudit({
    adminEmail: session.email,
    action: "product_create",
    targetType: "product",
    targetId: product.id,
    detail: product.name,
    ip: await clientIp(),
  });
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function updateProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!CUID_RE.test(id)) return { error: "Identificador de producto no válido." };

  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const product = await prisma.product.update({ where: { id }, data: parsed.data });
  await syncProductRecord(product);
  await logAudit({
    adminEmail: session.email,
    action: "product_update",
    targetType: "product",
    targetId: id,
    detail: parsed.data.name,
    ip: await clientIp(),
  });
  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!CUID_RE.test(id)) redirect("/admin/productos");

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { stripeProductId: true },
  });
  const inOrders = await prisma.orderItem.count({ where: { productId: id } });

  if (inOrders === 0) {
    // Never ordered: safe to hard-delete.
    await prisma.product.delete({ where: { id } });
  } else {
    // Referenced by existing orders: keep the history, just hide it (soft delete).
    await prisma.product.update({ where: { id }, data: { archived: true } });
  }

  if (existing?.stripeProductId) {
    try {
      await archiveStripeProduct(existing.stripeProductId);
    } catch (err) {
      console.error("Stripe archive failed:", err);
    }
  }
  await logAudit({
    adminEmail: session.email,
    action: inOrders === 0 ? "product_delete" : "product_archive",
    targetType: "product",
    targetId: id,
    ip: await clientIp(),
  });

  revalidatePath("/productos");
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

// --- Orders -----------------------------------------------------------------

const ORDER_STATUSES = [
  "paid",
  "preparando",
  "enviado",
  "entregado",
  "cancelado",
] as const;

const ORDER_STATUS_DESCRIPTION: Record<string, string> = {
  paid: "Pago recibido",
  preparando: "Preparando tu pedido",
  enviado: "Pedido enviado",
  entregado: "Pedido entregado",
  cancelado: "Pedido cancelado",
};

// Update an order's status manually and add a tracking-timeline entry that the
// customer sees. Uses single update + single create (no createMany/transaction,
// which the Neon HTTP adapter rejects).
export async function updateOrderStatus(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const id = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);

  if (!CUID_RE.test(id) || !(ORDER_STATUSES as readonly string[]).includes(status)) {
    redirect("/admin/pedidos");
  }

  await prisma.order.update({ where: { id }, data: { status } });
  await prisma.shipmentTracking.create({
    data: {
      orderId: id,
      status,
      description: note || ORDER_STATUS_DESCRIPTION[status] || "Actualización del pedido",
      location: null,
    },
  });
  await logAudit({
    adminEmail: session.email,
    action: "order_status_update",
    targetType: "order",
    targetId: id,
    detail: status,
    ip: await clientIp(),
  });

  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

// --- Admin users (role "admin" only) ---------------------------------------

const ADMIN_ROLES = ["admin", "editor"] as const;
const SETUP_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function activationLink(rawToken: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/admin/activar?token=${rawToken}`;
}

export async function inviteAdmin(formData: FormData): Promise<void> {
  await requireRole("admin");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || "Admin";
  const role = String(formData.get("role") ?? "editor");
  if (
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
    !(ADMIN_ROLES as readonly string[]).includes(role)
  ) {
    redirect("/admin/usuarios");
  }
  const { raw, hash } = generateSetupToken();
  const expires = new Date(Date.now() + SETUP_TTL_MS);
  await prisma.adminUser.upsert({
    where: { email },
    update: { name, role, passwordHash: null, setupToken: hash, setupTokenExpires: expires },
    create: { email, name, role, setupToken: hash, setupTokenExpires: expires },
  });
  redirect(`/admin/usuarios?link=${encodeURIComponent(activationLink(raw))}`);
}

export async function resetAdminPassword(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!CUID_RE.test(id)) redirect("/admin/usuarios");
  const { raw, hash } = generateSetupToken();
  await prisma.adminUser.update({
    where: { id },
    data: {
      passwordHash: null,
      setupToken: hash,
      setupTokenExpires: new Date(Date.now() + SETUP_TTL_MS),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  redirect(`/admin/usuarios?link=${encodeURIComponent(activationLink(raw))}`);
}

export async function setAdminRole(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!CUID_RE.test(id) || !(ADMIN_ROLES as readonly string[]).includes(role)) {
    redirect("/admin/usuarios");
  }
  await prisma.adminUser.update({ where: { id }, data: { role } });
  redirect("/admin/usuarios");
}

export async function deleteAdmin(formData: FormData): Promise<void> {
  const session = await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  // Can't delete your own account.
  if (CUID_RE.test(id) && id !== session.sub) {
    await prisma.adminUser.delete({ where: { id } });
  }
  redirect("/admin/usuarios");
}

export async function changeOwnPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  if (!rateLimit(`admin-pwd:${session.sub}`, 5, 10 * 60_000).allowed) {
    return { error: "Demasiados intentos. Espera unos minutos." };
  }
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }
  const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
  if (!user || !user.passwordHash || !verifyPassword(current, user.passwordHash)) {
    return { error: "La contraseña actual no es correcta." };
  }
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  });
  return { success: "Contraseña actualizada correctamente." };
}

// --- Store settings (role "admin" only) ------------------------------------

export async function saveSettings(formData: FormData): Promise<void> {
  await requireRole("admin");
  const ivaPercent = Math.min(
    100,
    Math.max(0, parseInt(String(formData.get("ivaPercent") ?? "21"), 10) || 0)
  );
  const freeShippingCents = Math.max(
    0,
    Math.round(Number(String(formData.get("freeShippingEuros") ?? "0").replace(",", ".")) * 100)
  );
  const shippingCents = Math.max(
    0,
    Math.round(Number(String(formData.get("shippingEuros") ?? "0").replace(",", ".")) * 100)
  );
  await prisma.settings.update({
    where: { id: "default" },
    data: { ivaPercent, freeShippingCents, shippingCents },
  });
  revalidatePath("/admin/ajustes");
  redirect("/admin/ajustes");
}
