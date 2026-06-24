"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword, hashToken } from "@/lib/auth";
import {
  setAdminSession,
  clearAdminSession,
  requireAdmin,
} from "@/lib/admin-session";
import { rateLimit } from "@/lib/rate-limit";
import { syncProductToStripe, archiveStripeProduct } from "@/lib/stripe-sync";

export interface ActionState {
  error?: string;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
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
          failedLoginAttempts: shouldLock ? 0 : attempts,
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

interface ProductData {
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  featured: boolean;
  images: string;
  availableUntil: Date | null;
}

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

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000)
    return { error: "El precio no es válido." };

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

// Mirror a product to Stripe and persist the returned ids. Non-fatal: a Stripe
// outage or misconfigured key must never block managing the catalog.
async function syncProductRecord(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
}): Promise<void> {
  try {
    const ids = await syncProductToStripe(product);
    await prisma.product.update({ where: { id: product.id }, data: ids });
  } catch (err) {
    console.error("Stripe product sync failed (product saved in DB):", err);
  }
}

export async function createProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();

  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const product = await prisma.product.create({ data: parsed.data });
  await syncProductRecord(product);
  await logAudit({
    adminEmail: session.email,
    action: "product_create",
    targetType: "product",
    targetId: product.id,
    detail: product.name,
    ip: await clientIp(),
  });
  revalidatePath("/productos");
  revalidatePath("/admin");
  redirect("/admin");
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
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!CUID_RE.test(id)) redirect("/admin");

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
  revalidatePath("/admin");
  redirect("/admin");
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
