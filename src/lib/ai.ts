// AI helpers for the product assistant, using Groq (free tier, no credit card)
// with a multimodal Llama 4 model. Groq exposes an OpenAI-compatible REST API.
//
// We use Groq because it offers a genuinely free tier with NO credit card and a
// vision-capable model (needed to verify the watch photos). Structured results
// are requested as JSON in the prompt and parsed defensively.
//
// Free-tier limitation: no live web search, so the market price is an
// APPROXIMATE estimate from the model's own knowledge (labelled in the UI),
// not scraped from real listings.
//
// Everything here runs server-side. Needs GROQ_API_KEY. If Groq deprecates the
// model id below, update MODEL (see https://console.groq.com/docs/models).

import { searchWeb } from "@/lib/web-search";

const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MAX_VISION_IMAGES = 5;

export type SupportedMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif";

export interface ParsedQuery {
  brand: string;
  model: string;
  reference: string;
  costEuros: number;
}

export interface MarketResearch {
  recommendedPriceEuros: number;
  marketMinEuros: number;
  marketMaxEuros: number;
  genuineMinEuros: number; // approx. floor price of a GENUINE unit
  demand: "alta" | "media" | "baja";
  estimatedTimeToSell: string;
  counterfeitRisk: "ninguno" | "posible" | "alto";
  warning: string; // Spanish authenticity/price warning, "" if none
  rationale: string;
  sources: string[];
  grounded: boolean; // true = based on real web listings, false = model estimate
}

export interface ImageAssessment {
  index: number;
  isWatch: boolean;
  matchesModel: boolean;
  confidence: "alta" | "media" | "baja";
  brandVisible: boolean;
  legalRiskLevel: "ninguno" | "bajo" | "alto";
  legalReasons: string[];
  note: string;
}

export interface GeneratedListing {
  name: string;
  category: string;
  description: string;
}

// --- REST plumbing ----------------------------------------------------------

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface ChatMessage {
  role: "system" | "user";
  content: string | ContentPart[];
}

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
}

function apiKey(): string {
  const k = process.env.GROQ_API_KEY;
  if (!k) throw new Error("GROQ_API_KEY no está configurada.");
  return k;
}

async function groqChat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 2048,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // Log the upstream detail server-side only; never echo it to the client.
    console.error("Groq error:", res.status, detail.slice(0, 300));
    if (res.status === 429) {
      throw new Error("Límite gratuito de Groq alcanzado; espera un momento.");
    }
    if (res.status === 400 && /decommission|not found|does not exist/i.test(detail)) {
      throw new Error(
        "El modelo de IA ya no está disponible en Groq; hay que actualizar el identificador del modelo."
      );
    }
    throw new Error("El servicio de IA no está disponible ahora mismo.");
  }
  const data = (await res.json()) as GroqResponse;
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("La IA no devolvió respuesta.");
  return text;
}

// Llama returns the JSON object possibly wrapped in prose/markdown — extract it.
function parseJsonLoose<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("La IA no devolvió JSON válido.");
  return JSON.parse(text.slice(start, end + 1)) as T;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], dflt: T): T =>
  allowed.includes(v as T) ? (v as T) : dflt;
const num = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);

// --- 1. Parse the free-text query ------------------------------------------

export async function parseProductQuery(text: string): Promise<ParsedQuery> {
  const raw = await groqChat(
    [
      {
        role: "system",
        content:
          "Extraes datos de un reloj del mensaje del administrador de una tienda. " +
          "El precio que menciona es el COSTE en euros al que ha encontrado el reloj (su compra), no el de venta. " +
          "Si no menciona precio, costEuros = 0. Devuelve la referencia/código del modelo (p. ej. AR11637) si aparece; si no, cadena vacía. " +
          'Responde ÚNICAMENTE con un objeto JSON, sin texto ni markdown, con esta forma exacta: ' +
          '{"brand": string, "model": string, "reference": string, "costEuros": number}',
      },
      { role: "user", content: text.slice(0, 600) },
    ],
    { temperature: 0, maxTokens: 256 }
  );
  const out = parseJsonLoose<Partial<ParsedQuery>>(raw);
  return {
    brand: str(out.brand).trim(),
    model: str(out.model).trim(),
    reference: str(out.reference).trim(),
    costEuros: num(out.costEuros),
  };
}

// --- 2. Market estimate (no live search on the free tier) ------------------

export async function researchMarket(q: ParsedQuery): Promise<MarketResearch | null> {
  try {
    // Pull real listings from the web when SERPER_API_KEY is set (free, no card).
    const results = await searchWeb(
      `${q.brand} ${q.model} ${q.reference} precio comprar`.replace(/\s+/g, " ").trim()
    );
    const grounded = results.length > 0;
    const domains = Array.from(
      new Set(results.map((r) => r.domain).filter(Boolean))
    ).slice(0, 6);
    const context = results
      .slice(0, 8)
      .map((r) => `- ${r.title} — ${r.snippet} [${r.domain}]`)
      .join("\n");

    const userContent = grounded
      ? `Reloj: ${q.brand} ${q.model} ${q.reference}`.trim() +
        `. Coste de adquisición: ${q.costEuros} €.\n\n` +
        "RESULTADOS DE BÚSQUEDA WEB (precios reales de tiendas/marketplaces; básate en ELLOS para el precio, no inventes):\n" +
        context +
        "\n\nA partir de esos listados reales: indica el rango de mercado y recomienda un precio de venta competitivo " +
        "(por encima del coste, con margen razonable). Estima la demanda y cuánto suele tardar en venderse. " +
        "Valora la autenticidad: ¿es coherente ese coste con los precios reales? En 'rationale' resume en qué listados te basas."
      : `Reloj: ${q.brand} ${q.model} ${q.reference}`.trim() +
        `. Coste de adquisición: ${q.costEuros} €. ` +
        "Estima su precio de venta habitual en España/UE y recomienda un precio de venta competitivo " +
        "(por encima del coste, con margen razonable). Estima la demanda y cuánto suele tardar en venderse un modelo así. " +
        "Es una ESTIMACIÓN aproximada basada en tu conocimiento (sin búsqueda en vivo); indícalo en 'rationale'. " +
        "Y valora la autenticidad: ¿es coherente ese coste para una pieza genuina?";

    const raw = await groqChat(
      [
        {
          role: "system",
          content:
            "Eres analista de una tienda de relojes en España. No inventes cifras: si no tienes datos suficientes, sé conservador y dilo en 'rationale'. " +
            "Evalúa TAMBIÉN si el COSTE indicado es plausible para una unidad AUTÉNTICA. Si el coste es muy inferior a lo que cuesta un ejemplar genuino " +
            "(típico de réplicas de marcas de lujo como Rolex, Omega, Cartier, Patek Philippe, Audemars Piguet, Breitling, IWC, Tudor…), pon counterfeitRisk 'alto' " +
            "y explica en 'warning' (en español) que casi con seguridad es una falsificación y que vender réplicas de marca es ILEGAL. Si hay dudas, 'posible'. Si es plausible, 'ninguno' y warning ''. " +
            "'genuineMinEuros' = precio mínimo aproximado en euros de una unidad AUTÉNTICA de ese modelo. " +
            'Responde ÚNICAMENTE con un objeto JSON, sin texto ni markdown, con esta forma exacta: ' +
            '{"recommendedPriceEuros": number, "marketMinEuros": number, "marketMaxEuros": number, "genuineMinEuros": number, ' +
            '"demand": "alta"|"media"|"baja", "estimatedTimeToSell": string, ' +
            '"counterfeitRisk": "ninguno"|"posible"|"alto", "warning": string, "rationale": string}',
        },
        { role: "user", content: userContent },
      ],
      { temperature: 0.2, maxTokens: 900 }
    );
    const out = parseJsonLoose<Partial<MarketResearch>>(raw);
    return {
      recommendedPriceEuros: Math.round(num(out.recommendedPriceEuros)),
      marketMinEuros: Math.round(num(out.marketMinEuros)),
      marketMaxEuros: Math.round(num(out.marketMaxEuros)),
      genuineMinEuros: Math.round(num(out.genuineMinEuros)),
      demand: oneOf(out.demand, ["alta", "media", "baja"] as const, "media"),
      estimatedTimeToSell: str(out.estimatedTimeToSell).slice(0, 120),
      counterfeitRisk: oneOf(
        out.counterfeitRisk,
        ["ninguno", "posible", "alto"] as const,
        "ninguno"
      ),
      warning: str(out.warning).slice(0, 400),
      rationale: str(out.rationale).slice(0, 800),
      sources: grounded ? domains : [],
      grounded,
    };
  } catch (err) {
    console.error("researchMarket failed:", err);
    return null;
  }
}

// --- 3. Verify candidate images with vision --------------------------------

export async function assessWatchImages(
  images: { mediaType: SupportedMediaType; data: string }[],
  q: ParsedQuery
): Promise<ImageAssessment[]> {
  if (images.length === 0) return [];
  const batch = images.slice(0, MAX_VISION_IMAGES);

  const content: ContentPart[] = [
    {
      type: "text",
      text:
        `Validas fotos de producto para una tienda de relojes. Reloj objetivo: ` +
        `${q.brand} ${q.model} ${q.reference}`.trim() +
        `. Te paso ${batch.length} imágenes EN ORDEN (índice empezando en 0). Evalúa CADA una:\n` +
        "- isWatch: ¿muestra un reloj de pulsera?\n" +
        "- matchesModel: ¿corresponde de forma plausible a ese modelo/marca?\n" +
        "- confidence: alta, media o baja.\n" +
        "- brandVisible: ¿se ve el logo o nombre de la marca?\n" +
        "- legalRiskLevel: riesgo legal EVIDENTE de usar la imagen: ninguno, bajo o alto. " +
        "Marca 'alto' si hay marcas de agua, sellos de banco de imágenes (Getty, Shutterstock, Alamy, iStock) " +
        "o el logo/nombre de otra tienda online sobre la foto.\n" +
        "- legalReasons: lista de motivos breves (vacía si ninguno).\n" +
        "- note: observación breve.\n" +
        'Responde ÚNICAMENTE con un objeto JSON, sin texto ni markdown, con esta forma exacta: ' +
        '{"results": [{"index": number, "isWatch": boolean, "matchesModel": boolean, ' +
        '"confidence": "alta"|"media"|"baja", "brandVisible": boolean, ' +
        '"legalRiskLevel": "ninguno"|"bajo"|"alto", "legalReasons": string[], "note": string}]}',
    },
    ...batch.map(
      (img): ContentPart => ({
        type: "image_url",
        image_url: { url: `data:${img.mediaType};base64,${img.data}` },
      })
    ),
  ];

  const raw = await groqChat([{ role: "user", content }], {
    temperature: 0,
    maxTokens: 2048,
  });
  const out = parseJsonLoose<{ results?: Partial<ImageAssessment>[] }>(raw);

  return (out.results ?? []).map((r, i) => ({
    index: Number.isInteger(r.index) ? Number(r.index) : i,
    isWatch: Boolean(r.isWatch),
    matchesModel: Boolean(r.matchesModel),
    confidence: oneOf(r.confidence, ["alta", "media", "baja"] as const, "media"),
    brandVisible: Boolean(r.brandVisible),
    legalRiskLevel: oneOf(
      r.legalRiskLevel,
      ["ninguno", "bajo", "alto"] as const,
      "bajo"
    ),
    legalReasons: Array.isArray(r.legalReasons)
      ? r.legalReasons.map((x) => str(x)).filter(Boolean)
      : [],
    note: str(r.note),
  }));
}

// --- 4. Generate the listing -----------------------------------------------

export async function generateListing(
  q: ParsedQuery,
  examples: string[],
  categories: string[]
): Promise<GeneratedListing> {
  const exampleText = examples
    .slice(0, 4)
    .map((d, i) => `Ejemplo ${i + 1}: ${d}`)
    .join("\n\n");
  const categoryText = categories.length
    ? `Categorías existentes en la tienda: ${categories.join(", ")}. Usa una si encaja; si no, propón una breve y coherente.`
    : "Propón una categoría breve (p. ej. Cronógrafos, Automáticos, Deportivos).";

  const raw = await groqChat(
    [
      {
        role: "system",
        content:
          "Redactas fichas de producto para una tienda de relojes en español (España), con el MISMO estilo, tono y longitud que los ejemplos. " +
          "La descripción debe tener entre 50 y 90 palabras, mencionar aspectos como caja/material, movimiento, cristal, resistencia al agua y correa cuando proceda, y terminar con un breve toque de marca. No incluyas el precio. " +
          "No inventes datos técnicos concretos que no puedas conocer con certeza (medidas exactas, materiales): si no estás seguro, descríbelo de forma genérica y veraz. " +
          'Responde ÚNICAMENTE con un objeto JSON, sin texto ni markdown, con esta forma exacta: ' +
          '{"name": string, "category": string, "description": string}',
      },
      {
        role: "user",
        content:
          `Reloj: ${q.brand} ${q.model} ${q.reference}`.trim() +
          `\n\n${categoryText}\n\n${exampleText || "(no hay ejemplos previos)"}`,
      },
    ],
    { temperature: 0.7, maxTokens: 700 }
  );
  const out = parseJsonLoose<Partial<GeneratedListing>>(raw);
  return {
    name: str(out.name).trim(),
    category: str(out.category).trim(),
    description: str(out.description).trim(),
  };
}
