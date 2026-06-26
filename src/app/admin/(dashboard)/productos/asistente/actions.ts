"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { createProductRecord, type ProductData } from "@/lib/products";
import { uploadProductImage } from "@/lib/blob";
import {
  searchImages,
  downloadImage,
  type DownloadedImage,
} from "@/lib/image-search";
import {
  parseProductQuery,
  researchMarket,
  assessWatchImages,
  generateListing,
  type ImageAssessment,
} from "@/lib/ai";
import type {
  AssistantCandidate,
  CreateInput,
  CreateResult,
  PrepareResult,
} from "./types";

const MAX = { name: 200, brand: 100, category: 100, description: 5000 } as const;
const MAX_CANDIDATES = 5;
const SEARCH_COUNT = 6;

async function clientIp(): Promise<string> {
  return getClientIp(await headers());
}

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

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

// --- Step 1: research + verify + draft -------------------------------------

export async function assistantPrepare(text: string): Promise<PrepareResult> {
  const session = await requireAdmin();

  // The assistant spends money (Claude + Google + Blob): throttle per admin.
  if (!rateLimit(`ai-assistant:${session.sub}`, 15, 10 * 60_000).allowed) {
    return { ok: false, error: "Has hecho muchas consultas. Espera unos minutos." };
  }

  const input = text.trim();
  if (input.length < 3 || input.length > 600) {
    return {
      ok: false,
      error: "Escribe la marca, el modelo y el precio al que lo encontraste.",
    };
  }

  // Parsing the model is essential — surfaces missing ANTHROPIC_API_KEY clearly.
  let query;
  try {
    query = await parseProductQuery(input);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "No se pudo procesar la solicitud.",
    };
  }
  if (!query.brand && !query.model) {
    return {
      ok: false,
      error: "No identifiqué el reloj. Indica la marca y el modelo.",
    };
  }

  const warnings: string[] = [];

  // Style context for the description, pulled from the live catalog.
  const [sample, catRows] = await Promise.all([
    prisma.product.findMany({
      where: { archived: false },
      select: { description: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.product.findMany({
      where: { archived: false },
      select: { category: true },
      distinct: ["category"],
      take: 20,
    }),
  ]);
  const examples = sample.map((p) => p.description);
  const categories = catRows.map((c) => c.category);

  const searchQuery = `${query.brand} ${query.model} ${query.reference} reloj`
    .replace(/\s+/g, " ")
    .trim();

  // Run independent work concurrently.
  const [urlsResult, market, listingResult] = await Promise.allSettled([
    searchImages(searchQuery, SEARCH_COUNT),
    researchMarket(query),
    generateListing(query, examples, categories),
  ]);

  if (urlsResult.status === "rejected") {
    warnings.push(
      "No se pudieron buscar imágenes automáticamente; añádelas manualmente."
    );
  }
  const urls = urlsResult.status === "fulfilled" ? urlsResult.value : [];

  let listing: PrepareResult["listing"];
  if (listingResult.status === "fulfilled") {
    const l = listingResult.value;
    listing = {
      name: l.name.slice(0, MAX.name),
      category: l.category.slice(0, MAX.category),
      description: l.description.slice(0, MAX.description),
    };
  } else {
    warnings.push("No se pudo generar la descripción automáticamente.");
  }

  const marketValue =
    market.status === "fulfilled" && market.value ? market.value : undefined;
  if (!marketValue) {
    warnings.push(
      "No se pudo estimar el precio de mercado; revísalo manualmente."
    );
  }

  // Download candidate images, verify with vision, re-host the good ones.
  const candidates: AssistantCandidate[] = [];
  if (urls.length > 0) {
    const downloaded = (
      await Promise.all(urls.map((u) => downloadImage(u)))
    ).filter((d): d is DownloadedImage => d !== null);

    if (downloaded.length > 0) {
      let assessments: ImageAssessment[];
      try {
        assessments = await assessWatchImages(
          downloaded.map((d) => ({ mediaType: d.mediaType, data: d.data })),
          query
        );
      } catch {
        assessments = [];
        warnings.push("No se pudo verificar las imágenes con la IA.");
      }

      for (const a of assessments) {
        if (candidates.length >= MAX_CANDIDATES) break;
        const img = downloaded[a.index];
        if (!img || !a.isWatch || !a.matchesModel) continue;
        try {
          const url = await uploadProductImage(img.bytes, img.mediaType, img.ext);
          candidates.push({
            url,
            confidence: a.confidence,
            legalRiskLevel: a.legalRiskLevel,
            legalReasons: a.legalReasons ?? [],
            note: a.note ?? "",
            recommended: a.legalRiskLevel !== "alto" && a.confidence !== "baja",
          });
        } catch (err) {
          console.error("Blob upload failed for candidate:", err);
        }
      }
    }
    if (candidates.length === 0) {
      warnings.push(
        "Ninguna imagen encontrada se verificó con seguridad; añade imágenes manualmente."
      );
    }
  }

  return {
    ok: true,
    query,
    listing,
    market: marketValue,
    candidates,
    warnings,
  };
}

// --- Step 2: publish --------------------------------------------------------

export async function assistantCreate(input: CreateInput): Promise<CreateResult> {
  const session = await requireAdmin();

  const name = String(input.name ?? "").trim();
  const brand = String(input.brand ?? "").trim();
  const category = String(input.category ?? "").trim();
  const description = String(input.description ?? "").trim();

  if (!name || name.length > MAX.name) return { ok: false, error: "Nombre no válido." };
  if (!brand || brand.length > MAX.brand) return { ok: false, error: "Marca no válida." };
  if (!category || category.length > MAX.category)
    return { ok: false, error: "Categoría no válida." };
  if (!description || description.length > MAX.description)
    return { ok: false, error: "Descripción no válida." };

  const priceEuros = Number(input.priceEuros);
  if (!Number.isFinite(priceEuros) || priceEuros <= 0 || priceEuros > 1_000_000)
    return { ok: false, error: "El precio de venta no es válido." };
  const price = Math.round(priceEuros * 100);

  const stock = Number(input.stock);
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000)
    return { ok: false, error: "El stock no es válido." };

  const images = Array.isArray(input.images)
    ? input.images.map((u) => String(u)).filter(isHttpsUrl)
    : [];
  if (images.length === 0) return { ok: false, error: "Añade al menos una imagen." };
  if (images.length > 10) return { ok: false, error: "Máximo 10 imágenes." };

  let availableUntil: Date | null = null;
  const rawDate = String(input.availableUntil ?? "").trim();
  if (rawDate) {
    const parsed = new Date(`${rawDate}T23:59:59`);
    if (Number.isNaN(parsed.getTime()))
      return { ok: false, error: "La fecha de disponibilidad no es válida." };
    availableUntil = parsed;
  }

  const data: ProductData = {
    name,
    brand,
    category,
    description,
    price,
    stock,
    featured: Boolean(input.featured),
    images: JSON.stringify(images),
    availableUntil,
  };

  const product = await createProductRecord(data);
  await logAudit({
    adminEmail: session.email,
    action: "product_create_ai",
    targetType: "product",
    targetId: product.id,
    detail: product.name,
    ip: await clientIp(),
  });
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
  return { ok: true, productId: product.id };
}
