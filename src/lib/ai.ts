// Claude-powered helpers for the product assistant.
//
// Uses the official Anthropic SDK (@anthropic-ai/sdk). All structured results
// are obtained via forced tool use (strict schema) so the output always matches
// the shape we expect; the one exception is market research, which uses the
// server-side web_search tool and returns JSON text we parse defensively.
//
// Everything here runs server-side (imported only from Server Actions). It
// never throws for "soft" failures the caller can tolerate — those return null.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";

let cached: Anthropic | null = null;
function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY no está configurada.");
  }
  cached ??= new Anthropic();
  return cached;
}

export type SupportedMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif";

export interface ParsedQuery {
  brand: string;
  model: string;
  reference: string;
  costEuros: number; // price the admin found it at (their cost)
}

export interface MarketResearch {
  recommendedPriceEuros: number;
  marketMinEuros: number;
  marketMaxEuros: number;
  demand: "alta" | "media" | "baja";
  estimatedTimeToSell: string; // orientativo, e.g. "2 a 4 semanas"
  rationale: string;
  sources: string[];
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

// --- Generic forced-tool call ----------------------------------------------

async function callTool<T>(params: {
  system: string;
  content: string | Anthropic.ContentBlockParam[];
  toolName: string;
  toolDescription: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const tool = {
    name: params.toolName,
    description: params.toolDescription,
    input_schema: params.schema,
    strict: true,
  } as unknown as Anthropic.Tool;

  const resp = await client().messages.create({
    model: MODEL,
    max_tokens: params.maxTokens ?? 1500,
    system: params.system,
    tools: [tool],
    tool_choice: { type: "tool", name: params.toolName },
    messages: [{ role: "user", content: params.content }],
  });

  if (resp.stop_reason === "refusal") {
    throw new Error("La IA rechazó procesar esta solicitud.");
  }
  const block = resp.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("La IA no devolvió datos estructurados.");
  }
  return block.input as T;
}

// --- 1. Parse the free-text query ------------------------------------------

export async function parseProductQuery(text: string): Promise<ParsedQuery> {
  const out = await callTool<ParsedQuery>({
    system:
      "Extraes datos de un reloj a partir del mensaje del administrador de una tienda. " +
      "El precio que menciona es el COSTE en euros al que ha encontrado el reloj (su precio de compra), no el de venta. " +
      "Si no menciona un precio, devuelve 0. Devuelve la marca, el modelo y la referencia (código del modelo, p. ej. AR11637) si aparece; si no hay referencia, cadena vacía.",
    content: text.slice(0, 600),
    toolName: "record_product_query",
    toolDescription: "Registra los datos del reloj extraídos del mensaje.",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        brand: { type: "string", description: "Marca del reloj" },
        model: { type: "string", description: "Nombre/modelo del reloj" },
        reference: {
          type: "string",
          description: "Referencia o código del modelo, o cadena vacía",
        },
        costEuros: {
          type: "number",
          description: "Precio de coste en euros mencionado, o 0",
        },
      },
      required: ["brand", "model", "reference", "costEuros"],
    },
    maxTokens: 400,
  });
  return {
    brand: String(out.brand ?? "").trim(),
    model: String(out.model ?? "").trim(),
    reference: String(out.reference ?? "").trim(),
    costEuros: Number.isFinite(out.costEuros) ? Number(out.costEuros) : 0,
  };
}

// --- 2. Market research (price + demand) via web search --------------------

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function researchMarket(
  q: ParsedQuery
): Promise<MarketResearch | null> {
  try {
    const system =
      "Eres analista de una tienda de relojes en España. Investigas en internet el precio de venta habitual de un reloj concreto " +
      "(preferentemente en tiendas y marketplaces de España/UE) y estimas su demanda. " +
      "Recomienda un precio de VENTA competitivo: alineado con el mercado y por encima del coste con un margen razonable. " +
      "La estimación de cuánto tarda en venderse es ORIENTATIVA (no hay datos reales del producto nuevo): básala en la popularidad/demanda del modelo. " +
      "No inventes cifras: si no encuentras precios, sé conservador y dilo en 'rationale'.";
    const userText =
      `Reloj: ${q.brand} ${q.model} ${q.reference}`.trim() +
      `. Coste de adquisición: ${q.costEuros} €. ` +
      "Busca su precio de venta habitual y recomienda un precio de venta. Estima la demanda y cuánto suele tardar en venderse un modelo así. " +
      'Responde ÚNICAMENTE con un objeto JSON válido (sin markdown ni texto extra) con esta forma exacta: ' +
      '{"recommendedPriceEuros": number, "marketMinEuros": number, "marketMaxEuros": number, ' +
      '"demand": "alta"|"media"|"baja", "estimatedTimeToSell": string, "rationale": string, "sources": string[]}';

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: userText },
    ];
    let resp = await client().messages.create({
      model: MODEL,
      max_tokens: 2000,
      system,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
      messages,
    });

    // Server-tool loop may pause; resume a bounded number of times.
    let guard = 0;
    while (resp.stop_reason === "pause_turn" && guard < 3) {
      guard += 1;
      messages.push({
        role: "assistant",
        content: resp.content as Anthropic.ContentBlockParam[],
      });
      resp = await client().messages.create({
        model: MODEL,
        max_tokens: 2000,
        system,
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 5 },
        ],
        messages,
      });
    }

    if (resp.stop_reason === "refusal") return null;

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const json = extractJson(text);
    if (!json) return null;

    const demandRaw = String(json.demand ?? "media");
    const demand: MarketResearch["demand"] =
      demandRaw === "alta" || demandRaw === "baja" ? demandRaw : "media";
    const num = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);

    return {
      recommendedPriceEuros: Math.round(num(json.recommendedPriceEuros)),
      marketMinEuros: Math.round(num(json.marketMinEuros)),
      marketMaxEuros: Math.round(num(json.marketMaxEuros)),
      demand,
      estimatedTimeToSell: String(json.estimatedTimeToSell ?? "").slice(0, 120),
      rationale: String(json.rationale ?? "").slice(0, 800),
      sources: Array.isArray(json.sources)
        ? json.sources.map((s) => String(s).slice(0, 160)).slice(0, 6)
        : [],
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

  const content: Anthropic.ContentBlockParam[] = images.map((img) => ({
    type: "image",
    source: { type: "base64", media_type: img.mediaType, data: img.data },
  }));
  content.push({
    type: "text",
    text:
      `Estás validando fotos de producto para una tienda de relojes. Reloj objetivo: ` +
      `${q.brand} ${q.model} ${q.reference}`.trim() +
      `. Evalúa CADA imagen en orden (índice empezando en 0):\n` +
      "- isWatch: ¿muestra un reloj de pulsera?\n" +
      "- matchesModel: ¿corresponde de forma plausible a ese modelo/marca?\n" +
      "- confidence: tu confianza (alta/media/baja).\n" +
      "- brandVisible: ¿se ve el logo o nombre de la marca?\n" +
      "- legalRiskLevel: riesgo legal EVIDENTE de usar la imagen (ninguno/bajo/alto). " +
      "Marca 'alto' si hay marcas de agua, sellos de banco de imágenes (Getty, Shutterstock, Alamy, iStock), " +
      "o el logo/nombre de otra tienda online sobre la foto.\n" +
      "- legalReasons: motivos breves del riesgo (vacío si ninguno).\n" +
      "- note: observación breve.",
  });

  const out = await callTool<{ results: ImageAssessment[] }>({
    system:
      "Analizas imágenes y devuelves una evaluación objetiva por imagen. " +
      "No garantizas la titularidad de derechos; solo señalas riesgos visibles.",
    content,
    toolName: "report_image_assessment",
    toolDescription: "Devuelve la evaluación de cada imagen, en orden.",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              index: { type: "integer" },
              isWatch: { type: "boolean" },
              matchesModel: { type: "boolean" },
              confidence: { type: "string", enum: ["alta", "media", "baja"] },
              brandVisible: { type: "boolean" },
              legalRiskLevel: {
                type: "string",
                enum: ["ninguno", "bajo", "alto"],
              },
              legalReasons: { type: "array", items: { type: "string" } },
              note: { type: "string" },
            },
            required: [
              "index",
              "isWatch",
              "matchesModel",
              "confidence",
              "brandVisible",
              "legalRiskLevel",
              "legalReasons",
              "note",
            ],
          },
        },
      },
      required: ["results"],
    },
    maxTokens: 2500,
  });

  return Array.isArray(out.results) ? out.results : [];
}

// --- 4. Generate the listing (name + category + description) ---------------

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
    ? `Categorías existentes en la tienda: ${categories.join(", ")}. Usa una de ellas si encaja; si no, propón una breve y coherente.`
    : "Propón una categoría breve y coherente (p. ej. Cronógrafos, Automáticos, Deportivos).";

  return callTool<GeneratedListing>({
    system:
      "Redactas fichas de producto para una tienda de relojes en español (España), con el MISMO estilo, tono y longitud que los ejemplos. " +
      "La descripción debe tener entre 50 y 90 palabras, mencionar aspectos como caja/material, movimiento, cristal, resistencia al agua y correa cuando proceda, " +
      "y terminar con un breve toque de marca. No incluyas el precio. " +
      "IMPORTANTE: no inventes datos técnicos concretos que no puedas conocer con certeza (medidas exactas, materiales): si no estás seguro, descríbelo de forma genérica y veraz.",
    content:
      `Reloj: ${q.brand} ${q.model} ${q.reference}`.trim() +
      `\n\n${categoryText}\n\n${exampleText || "(no hay ejemplos previos)"}`,
    toolName: "write_listing",
    toolDescription: "Devuelve el nombre, la categoría y la descripción del producto.",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string", description: "Nombre comercial del producto" },
        category: { type: "string", description: "Categoría del producto" },
        description: {
          type: "string",
          description: "Descripción en español, 50-90 palabras",
        },
      },
      required: ["name", "category", "description"],
    },
    maxTokens: 900,
  });
}
