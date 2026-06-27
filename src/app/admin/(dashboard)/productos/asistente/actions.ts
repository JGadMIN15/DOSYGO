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
  downloadImage,
  isBlobUrl,
  type DownloadedImage,
} from "@/lib/image-search";
import {
  parseProductQuery,
  researchMarket,
  assessWatchImages,
  generateListing,
  type ParsedQuery,
  type ImageAssessment,
  type MarketResearch,
} from "@/lib/ai";
import type {
  AssistantCandidate,
  AssistantQuery,
  CreateInput,
  CreateResult,
  PrepareResult,
  VerifyResult,
} from "./types";

const MAX = { name: 200, brand: 100, category: 100, description: 5000 } as const;
const MAX_IMAGES = 5; // matches the vision model's per-request image cap

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

// Ultra-luxury brands whose genuine units never sell for a few hundred euros —
// a low cost almost always means a replica (illegal to sell as the brand).
const LUXURY_BRANDS = [
  "rolex", "patek", "audemars", "vacheron", "richard mille", "a. lange",
  "omega", "cartier", "breitling", "iwc", "jaeger", "panerai", "hublot",
  "zenith", "breguet", "tudor", "tag heuer", "blancpain", "ulysse nardin",
];

function isLuxuryBrand(brand: string): boolean {
  const b = brand.toLowerCase();
  return LUXURY_BRANDS.some((x) => b.includes(x));
}

// Combine the model's authenticity judgement with deterministic safety checks
// (cost far below genuine floor, luxury brand at an implausible cost).
function assessCounterfeit(
  q: ParsedQuery,
  market: MarketResearch | undefined
): { level: "posible" | "alto"; message: string } | null {
  const reasons: string[] = [];
  let level: "posible" | "alto" | null = null;

  if (market?.counterfeitRisk === "alto") {
    level = "alto";
    if (market.warning) reasons.push(market.warning);
  } else if (market?.counterfeitRisk === "posible") {
    level = "posible";
    if (market.warning) reasons.push(market.warning);
  }

  const cost = q.costEuros;
  if (cost > 0 && market) {
    const floor =
      market.genuineMinEuros > 0 ? market.genuineMinEuros : market.marketMinEuros;
    if (floor > 0 && cost < floor * 0.35) {
      level = "alto";
      reasons.push(
        `El coste indicado (${cost} €) es muy inferior al de un ejemplar auténtico (~${floor} € o más): posible réplica o precio incoherente.`
      );
    }
  }

  if (cost > 0 && cost < 800 && isLuxuryBrand(q.brand)) {
    level = "alto";
    reasons.push(
      `${q.brand} es una marca de lujo; a ${cost} € casi con seguridad es una réplica. Vender falsificaciones de marca es ILEGAL.`
    );
  }

  if (!level) return null;
  const message = reasons.length
    ? Array.from(new Set(reasons)).join(" ")
    : "Revisa la autenticidad: el coste indicado parece incoherente con el precio de mercado.";
  return { level, message };
}

function sanitizeQuery(q: AssistantQuery): ParsedQuery {
  return {
    brand: String(q.brand ?? "").slice(0, MAX.brand),
    model: String(q.model ?? "").slice(0, 200),
    reference: String(q.reference ?? "").slice(0, 100),
    costEuros: Number.isFinite(q.costEuros) ? Number(q.costEuros) : 0,
  };
}

// --- Step 1: research + draft (no images) ----------------------------------

export async function assistantPrepare(text: string): Promise<PrepareResult> {
  const session = await requireAdmin();

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

  let query: ParsedQuery;
  try {
    query = await parseProductQuery(input);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo procesar la solicitud.",
    };
  }
  if (!query.brand && !query.model) {
    return { ok: false, error: "No identifiqué el reloj. Indica la marca y el modelo." };
  }

  const warnings: string[] = [];

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

  const [market, listingResult] = await Promise.allSettled([
    researchMarket(query),
    generateListing(
      query,
      sample.map((p) => p.description),
      catRows.map((c) => c.category)
    ),
  ]);

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
    warnings.push("No se pudo estimar el precio de mercado; revísalo manualmente.");
  }

  const counterfeit = assessCounterfeit(query, marketValue) ?? undefined;

  return { ok: true, query, listing, market: marketValue, counterfeit, warnings };
}

// --- Step 2: verify admin-provided images + re-host to Blob ----------------

export async function assistantVerifyImages(
  urls: string[],
  q: AssistantQuery
): Promise<VerifyResult> {
  const session = await requireAdmin();

  if (!rateLimit(`ai-verify:${session.sub}`, 20, 10 * 60_000).allowed) {
    return { ok: false, error: "Has verificado muchas veces. Espera unos minutos." };
  }

  const clean = Array.from(
    new Set((Array.isArray(urls) ? urls : []).map((u) => String(u)).filter(isHttpsUrl))
  ).slice(0, MAX_IMAGES);
  if (clean.length === 0) {
    return { ok: false, error: "Añade al menos una imagen (URL https o súbela)." };
  }

  const query = sanitizeQuery(q);
  const warnings: string[] = [];

  const downloaded = (await Promise.all(clean.map((u) => downloadImage(u)))).filter(
    (d): d is DownloadedImage => d !== null
  );
  const failed = clean.length - downloaded.length;
  if (failed > 0) {
    warnings.push(
      `${failed} imagen(es) no se pudieron descargar (usa jpg/png/webp/gif, máx 8 MB).`
    );
  }
  if (downloaded.length === 0) {
    return { ok: false, error: "No se pudo descargar ninguna imagen válida.", warnings };
  }

  let assessments: ImageAssessment[];
  try {
    assessments = await assessWatchImages(
      downloaded.map((d) => ({ mediaType: d.mediaType, data: d.data })),
      query
    );
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo verificar las imágenes.",
      warnings,
    };
  }

  const candidates: AssistantCandidate[] = [];
  for (const a of assessments) {
    const img = downloaded[a.index];
    if (!img) continue;
    let url: string;
    try {
      url = isBlobUrl(img.sourceUrl)
        ? img.sourceUrl
        : await uploadProductImage(img.bytes, img.mediaType, img.ext);
    } catch (err) {
      console.error("Blob upload failed:", err);
      warnings.push("No se pudo guardar una imagen en el almacenamiento.");
      continue;
    }
    candidates.push({
      url,
      matchesModel: Boolean(a.matchesModel),
      isWatch: Boolean(a.isWatch),
      confidence: a.confidence,
      legalRiskLevel: a.legalRiskLevel,
      legalReasons: a.legalReasons ?? [],
      note: a.note ?? "",
      recommended:
        Boolean(a.matchesModel) &&
        Boolean(a.isWatch) &&
        a.legalRiskLevel !== "alto" &&
        a.confidence !== "baja",
    });
  }

  return { ok: true, candidates, warnings };
}

// --- Step 3: publish --------------------------------------------------------

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
