import { NextRequest } from "next/server";
import { streamText } from "ai";
import { headers } from "next/headers";
import { searchCatalog } from "@/lib/catalog";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// "The Time" — the storefront watch assistant. Recommends from OUR catalogue
// (searched server-side and injected into the system prompt) and streams the
// reply as plain text. Model routes through the Vercel AI Gateway.
export async function POST(req: NextRequest) {
  const ip = getClientIp(await headers());
  if (!rateLimit(`chat:${ip}`, 20, 60_000).allowed) {
    return new Response("Demasiadas preguntas seguidas. Espera un momento.", { status: 429 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Petición no válida", { status: 400 });
  }

  const clean = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (clean.length === 0) return new Response("Sin mensajes", { status: 400 });

  const lastUser = [...clean].reverse().find((m) => m.role === "user")?.content ?? "";
  const matches = searchCatalog(lastUser, 8);
  const catalogList = matches
    .map((m) => `- ${m.brand} ${m.sku} → /catalogo/${encodeURIComponent(m.sku)}`)
    .join("\n");

  const system = `Eres "The Time", el asistente de relojes de la tienda Dos&Go. Hablas en español, con calidez y de forma breve (2 a 4 frases). Tu misión es ayudar al cliente a encontrar y elegir relojes de NUESTRO catálogo y guiarle a reservar.

REGLAS:
- Recomienda SOLO modelos de la lista de catálogo de abajo. No inventes modelos, ni precios, ni especificaciones (no tenemos precios en el catálogo).
- Cuando recomiendes un modelo, escríbelo como enlace markdown EXACTO: [Marca Referencia](/catalogo/REFERENCIA), usando las rutas que te doy.
- Sugiere 2 o 3 opciones como máximo. Si no está justo lo que pide, ofrece lo más parecido del catálogo.
- Para reservar o una consulta personalizada: explica que en la ficha del reloj puede reservarlo con una señal de 50 € (reembolsable si no lo conseguimos en 14 días), o escribir a info@dosandgo.com.
- No hables de otras tiendas ni inventes datos. Si no lo sabes, dilo con honestidad.

CATÁLOGO RELEVANTE PARA ESTA CONSULTA:
${catalogList || "(sin coincidencias claras; pídele la marca o el estilo que busca)"}`;

  const result = streamText({
    model: process.env.THETIME_MODEL ?? "zai/glm-4.6v-flash",
    system,
    messages: clean,
  });

  return result.toTextStreamResponse();
}
