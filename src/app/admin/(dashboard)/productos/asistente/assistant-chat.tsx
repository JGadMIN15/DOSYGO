"use client";

import { useState } from "react";
import Link from "next/link";
import { assistantPrepare, assistantCreate } from "./actions";
import type { PrepareResult } from "./types";

interface Bubble {
  role: "assistant" | "user";
  text: string;
}

const riskBadge: Record<string, { label: string; cls: string }> = {
  ninguno: { label: "Sin riesgo aparente", cls: "bg-green-100 text-green-700" },
  bajo: { label: "Riesgo bajo", cls: "bg-amber-100 text-amber-700" },
  alto: { label: "⚠ Riesgo alto", cls: "bg-red-100 text-red-700" },
};

const INTRO =
  "Hola 👋 Dime la marca, el modelo y a qué precio lo encontraste. " +
  'Por ejemplo: «Emporio Armani Racer AR11637, lo encontré a 89€».';

export default function AssistantChat() {
  const [messages, setMessages] = useState<Bubble[]>([
    { role: "assistant", text: INTRO },
  ]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<
    "input" | "loading" | "review" | "publishing" | "done"
  >("input");
  const [result, setResult] = useState<PrepareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable listing fields
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priceEuros, setPriceEuros] = useState("");
  const [stock, setStock] = useState("1");
  const [featured, setFeatured] = useState(false);
  const [availableUntil, setAvailableUntil] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function say(role: Bubble["role"], text: string) {
    setMessages((m) => [...m, { role, text }]);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || phase === "loading") return;
    setError(null);
    setInput("");
    say("user", text);
    say("assistant", "Buscando imágenes, estimando precio y redactando la ficha… (puede tardar un poco)");
    setPhase("loading");

    let res: PrepareResult;
    try {
      res = await assistantPrepare(text);
    } catch {
      say("assistant", "Algo falló al procesar la solicitud. Inténtalo de nuevo.");
      setPhase("input");
      return;
    }

    if (!res.ok) {
      say("assistant", res.error ?? "No se pudo procesar la solicitud.");
      setPhase("input");
      return;
    }

    setResult(res);
    if (res.listing) {
      setName(res.listing.name);
      setCategory(res.listing.category);
      setDescription(res.listing.description);
    }
    if (res.query) setBrand(res.query.brand);
    const recommended =
      res.market?.recommendedPriceEuros && res.market.recommendedPriceEuros > 0
        ? res.market.recommendedPriceEuros
        : res.query?.costEuros && res.query.costEuros > 0
          ? res.query.costEuros
          : 0;
    setPriceEuros(recommended > 0 ? String(recommended) : "");
    setSelected((res.candidates ?? []).filter((c) => c.recommended).map((c) => c.url));

    const parts: string[] = [];
    parts.push(
      `He preparado la ficha de ${res.query?.brand ?? ""} ${res.query?.model ?? ""}`.trim() + "."
    );
    if (res.market) {
      parts.push(
        `Precio de venta recomendado: ${res.market.recommendedPriceEuros} € ` +
          `(mercado ~${res.market.marketMinEuros}–${res.market.marketMaxEuros} €). ` +
          `Demanda ${res.market.demand}; tiempo estimado de venta (orientativo): ${res.market.estimatedTimeToSell}.`
      );
    }
    parts.push(
      `Encontré ${res.candidates?.length ?? 0} imágenes verificadas.`
    );
    parts.push("Revisa los datos abajo, elige las imágenes e indica hasta cuándo estará disponible (opcional). Cuando quieras, pulsa Publicar.");
    say("assistant", parts.join(" "));
    (res.warnings ?? []).forEach((w) => say("assistant", "Aviso: " + w));
    setPhase("review");
  }

  function toggleImage(url: string) {
    setSelected((s) => (s.includes(url) ? s.filter((u) => u !== url) : [...s, url]));
  }

  async function handlePublish() {
    setError(null);
    if (selected.length === 0) {
      setError("Selecciona al menos una imagen.");
      return;
    }
    setPhase("publishing");
    try {
      const res = await assistantCreate({
        name,
        brand,
        category,
        description,
        priceEuros: Number(priceEuros.replace(",", ".")),
        stock: Number(stock),
        featured,
        availableUntil,
        images: selected,
      });
      if (!res.ok) {
        setError(res.error ?? "No se pudo publicar.");
        setPhase("review");
        return;
      }
      setCreatedId(res.productId ?? null);
      say("assistant", `✅ Producto publicado: ${name}.`);
      setPhase("done");
    } catch {
      setError("No se pudo publicar. Inténtalo de nuevo.");
      setPhase("review");
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setName("");
    setBrand("");
    setCategory("");
    setDescription("");
    setPriceEuros("");
    setStock("1");
    setFeatured(false);
    setAvailableUntil("");
    setSelected([]);
    setCreatedId(null);
    setMessages([{ role: "assistant", text: INTRO }]);
    setPhase("input");
  }

  const market = result?.market;
  const candidates = result?.candidates ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Transcript */}
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {phase === "loading" && (
            <div className="text-xs text-gray-400 pl-1">Procesando…</div>
          )}
        </div>
        <div className="border-t border-gray-100 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={phase === "loading" || phase === "publishing"}
              placeholder="Marca, modelo y precio de coste…"
              className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={phase === "loading" || phase === "publishing"}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand, #dc2626)" }}
            >
              Enviar
            </button>
          </form>
        </div>
      </div>

      {/* Review / result panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 h-[70vh] overflow-y-auto">
        {phase === "done" ? (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-gray-900 mb-1">Producto publicado</p>
            <p className="text-sm text-gray-500 mb-6">{name}</p>
            <div className="flex flex-col gap-2 items-center">
              <Link
                href="/admin/productos"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--brand, #dc2626)" }}
              >
                Ver productos
              </Link>
              {createdId && (
                <Link
                  href={`/admin/productos/${createdId}`}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Editar este producto
                </Link>
              )}
              <button
                onClick={reset}
                className="text-sm text-gray-500 hover:text-gray-900 mt-2"
              >
                Añadir otro
              </button>
            </div>
          </div>
        ) : !result ? (
          <div className="text-sm text-gray-400 h-full flex items-center justify-center text-center px-6">
            La ficha preparada aparecerá aquí para que la revises antes de
            publicar.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Market */}
            {market && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm">
                <p className="font-semibold text-gray-900 mb-1">
                  Análisis de mercado
                </p>
                <p className="text-gray-700">
                  Recomendado: <strong>{market.recommendedPriceEuros} €</strong>{" "}
                  · Mercado ~{market.marketMinEuros}–{market.marketMaxEuros} €
                </p>
                <p className="text-gray-700">
                  Demanda: <strong>{market.demand}</strong> · Tiempo estimado de
                  venta (orientativo): {market.estimatedTimeToSell}
                </p>
                {market.rationale && (
                  <p className="text-gray-500 mt-1 text-xs">{market.rationale}</p>
                )}
                {market.sources.length > 0 && (
                  <p className="text-gray-400 mt-1 text-xs">
                    Fuentes: {market.sources.join(" · ")}
                  </p>
                )}
              </div>
            )}

            {/* Legal caveat */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              La IA marca riesgos <strong>evidentes</strong> (marcas de agua,
              logos de tiendas, sellos de stock), pero <strong>no garantiza</strong>{" "}
              que una imagen esté libre de derechos. Usa preferentemente fotos
              oficiales o propias y revisa antes de publicar.
            </div>

            {/* Images */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Imágenes ({selected.length} seleccionadas)
              </p>
              {candidates.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No hay imágenes verificadas. Puedes crear el producto y añadir
                  imágenes después desde el editor.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {candidates.map((c) => {
                    const on = selected.includes(c.url);
                    const badge = riskBadge[c.legalRiskLevel] ?? riskBadge.bajo;
                    return (
                      <button
                        type="button"
                        key={c.url}
                        onClick={() => toggleImage(c.url)}
                        className={`relative rounded-lg overflow-hidden border-2 text-left ${
                          on ? "border-gray-900" : "border-gray-200"
                        }`}
                        title={c.note}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.url}
                          alt=""
                          className="w-full aspect-square object-cover bg-gray-100"
                        />
                        <span
                          className={`absolute top-1 left-1 rounded px-1.5 py-0.5 text-[9px] font-semibold ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        {on && (
                          <span className="absolute top-1 right-1 bg-gray-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            ✓
                          </span>
                        )}
                        <span className="block text-[10px] text-gray-500 px-1 py-0.5">
                          Coincidencia: {c.confidence}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Editable fields */}
            <div className="space-y-3">
              <Field label="Nombre">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Marca">
                  <input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Categoría">
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Descripción">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Precio venta (€)">
                  <input
                    value={priceEuros}
                    onChange={(e) => setPriceEuros(e.target.value)}
                    inputMode="decimal"
                    className={inputCls}
                  />
                </Field>
                <Field label="Stock">
                  <input
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    inputMode="numeric"
                    className={inputCls}
                  />
                </Field>
                <Field label="Disponible hasta">
                  <input
                    type="date"
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                Destacado
              </label>
              {result.query && result.query.costEuros > 0 && (
                <p className="text-xs text-gray-400">
                  Coste indicado: {result.query.costEuros} €
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handlePublish}
                disabled={phase === "publishing"}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--brand, #dc2626)" }}
              >
                {phase === "publishing" ? "Publicando…" : "Publicar producto"}
              </button>
              <button
                onClick={reset}
                disabled={phase === "publishing"}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
