"use client";

import { useState } from "react";
import { Copy, Check, TicketCheck } from "lucide-react";

// Shows the guest customer their reservation link with a strong "save this"
// warning + a copy button. No account exists, so this URL is the ONLY way back.
export default function ReservationTicketLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the input is selectable as a fallback
    }
  }

  return (
    <div className="rounded-2xl border-2 p-5" style={{ borderColor: "var(--brand)", background: "rgba(220,38,38,0.04)" }}>
      <p className="font-bold text-gray-900 flex items-center gap-2 mb-1">
        <TicketCheck className="w-5 h-5" style={{ color: "var(--brand)" }} />
        Guarda este enlace bajo cualquier circunstancia
      </p>
      <p className="text-sm text-gray-600 mb-3">
        Es tu acceso a la reserva. Desde aquí puedes <strong>ver cómo va tu reloj</strong> y{" "}
        <strong>cancelar la reserva</strong>. No hace falta cuenta: este enlace <strong>es tu única llave</strong>, no lo pierdas.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-mono text-gray-700 outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar</>}
        </button>
      </div>
      <a href={url} className="mt-3 inline-block text-sm font-semibold underline" style={{ color: "var(--brand)" }}>
        Abrir mi reserva →
      </a>
    </div>
  );
}
