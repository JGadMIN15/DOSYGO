"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Clock } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hola 👋 Soy **The Time**, tu asesor de relojes de Dos&Go. Dime qué marca o estilo buscas y te recomiendo modelos de nuestro catálogo para reservar.",
};

const CHIPS = ["Recomiéndame un reloj", "¿Tenéis Armani?", "Busco algo elegante", "Un reloj deportivo"];

// Render assistant text with **bold** and internal [label](/catalogo/...) links.
function render(text: string) {
  const nodes: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\((\/catalogo[^\s)]*)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2]) {
      nodes.push(
        <Link key={i++} href={m[2]} className="underline font-semibold" style={{ color: "var(--brand)" }}>
          {m[1]}
        </Link>
      );
    } else if (m[3]) {
      nodes.push(<strong key={i++}>{m[3]}</strong>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function TheTimeChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (pathname && pathname.startsWith("/admin")) return null;

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING) }),
      });
      if (!res.ok || !res.body) {
        setMessages((m) => [...m, { role: "assistant", content: "Ahora mismo no puedo responder. Inténtalo en un momento 🙏" }]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Error de conexión. Inténtalo de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="print:hidden">
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir The Time"
          className="fixed bottom-5 left-5 z-[70] inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-3 text-white shadow-2xl transition-transform hover:scale-105"
          style={{ background: "linear-gradient(90deg, var(--brand), var(--brand-dark))" }}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-bold">The Time</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 left-5 z-[70] w-[calc(100%-2.5rem)] max-w-sm h-[70vh] max-h-[560px] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden" style={{ background: "#0d0d12" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-dark))" }}>
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">The Time</p>
                <p className="text-[11px]" style={{ color: "var(--gold)" }}>Asesor de relojes · Dos&amp;Go</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3">
            {messages.map((m, k) => (
              <div key={k} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "text-white rounded-br-sm" : "text-gray-100 rounded-bl-sm"
                  }`}
                  style={m.role === "user" ? { background: "var(--brand)" } : { background: "#1b1b22" }}
                >
                  {m.role === "assistant" ? render(m.content || (loading ? "…" : "")) : m.content}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm text-gray-400" style={{ background: "#1b1b22" }}>The Time está pensando…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chips (only before the first question) */}
          {messages.length === 1 && (
            <div className="px-3.5 pb-2 flex flex-wrap gap-1.5">
              {CHIPS.map((c) => (
                <button key={c} onClick={() => send(c)} className="text-[11px] text-gray-200 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10">
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 px-3 py-3 border-t border-white/10"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta por un reloj o marca…"
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40"
              style={{ background: "var(--brand)" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
