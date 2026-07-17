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

  const system = `Eres "The Time", el asistente de relojes de la tienda Dos&Go. Hablas en español, con calidez y de forma breve (2 a 4 frases). Puedes buscar en internet para informarte sobre cualquier reloj. Tu misión es ayudar al cliente a encontrar el reloj perfecto y guiarle a reservar en Dos&Go.

CÓMO ACTÚAS:
- PRIMERO, nuestro catálogo: si lo que pide encaja con la lista de catálogo de abajo, recomiéndaselo. Escribe cada modelo como enlace markdown EXACTO: [Marca Referencia](/catalogo/REFERENCIA), usando las rutas que te doy. Máximo 2-3 opciones.
- Si pregunta por un reloj o un nombre que NO está en nuestro catálogo (por ejemplo un modelo concreto o un apodo popular), BUSCA en internet para identificarlo y descríbelo en 1-2 frases con datos reales. Luego, con honestidad: di que quizá no lo tengamos exacto, ofrécele lo más parecido de nuestro catálogo (con enlace) y dile que para conseguir ese modelo concreto puede escribir a info@dosandgo.com para un pedido personalizado.
- Para reservar: en la ficha del reloj se reserva con una señal de 50 € (reembolsable si no lo conseguimos en 14 días).

REGLAS:
- No inventes referencias de nuestro catálogo: usa solo las rutas que te doy.
- No menciones otras tiendas, ni precios de terceros, ni pongas enlaces o citas a webs externas. Responde en prosa natural, sin números de cita tipo [1].
- No inventes precios de nuestros relojes (no tenemos precios en el catálogo). Si no sabes algo, dilo.

CATÁLOGO RELEVANTE PARA ESTA CONSULTA:
${catalogList || "(sin coincidencias claras en el catálogo; si procede, usa internet para identificar lo que pide y ofrece alternativas o el pedido personalizado)"}`;

  const result = streamText({
    model: process.env.THETIME_MODEL ?? "perplexity/sonar-pro",
    system,
    messages: clean,
  });

  return result.toTextStreamResponse();
}
